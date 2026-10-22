using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Threading.RateLimiting;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Api.Configuration;
using GlpiTicketManager.Api.Endpoints;
using GlpiTicketManager.Api.Exceptions;
using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Api.Notifications;
using GlpiTicketManager.Api.OpenApi;
using GlpiTicketManager.Api.RateLimiting;
using GlpiTicketManager.Application;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using Npgsql;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;

var builder = WebApplication.CreateBuilder(args);

// ---- Fail-fast on missing / placeholder secrets -------------------------
// The API must not boot with weak or default credentials (see ADR + docs/12-security/secrets.md).
StartupConfigurationValidator.Validate(builder.Configuration);

// ---- Structured logging -------------------------------------------------
builder.Host.UseSerilog((context, services, loggerConfiguration) => loggerConfiguration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .WriteTo.Console(new CompactJsonFormatter()));

// ---- Application layers (Clean Architecture) ----------------------------
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// ---- Authentication: the API's own JWT, not GLPI's session --------------
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>() ?? new JwtOptions();

builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = "role",
            NameClaimType = JwtRegisteredClaimNames.UniqueName
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs/tickets"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var jti = context.Principal?.FindFirst(JwtRegisteredClaimNames.Jti)?.Value
                       ?? context.Principal?.FindFirst("jti")?.Value;

                if (string.IsNullOrEmpty(jti))
                {
                    context.Fail("Token has no jti claim.");
                    return;
                }

                var revokedRepo = context.HttpContext.RequestServices
                    .GetRequiredService<IRevokedTokenRepository>();

                if (await revokedRepo.IsRevokedAsync(jti, context.HttpContext.RequestAborted))
                {
                    context.Fail("Token has been revoked.");
                }
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSignalR();
builder.Services.AddScoped<ITicketNotificationService, TicketNotificationService>();

// ---- Rate limiting (native .NET 9) --------------------------------------
builder.Services.AddRateLimiter(options =>
{
    var rateLimitOptions = builder.Configuration
        .GetSection(RateLimitOptions.SectionName)
        .Get<RateLimitOptions>() ?? new RateLimitOptions();

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy(RateLimitPolicies.Login, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimitOptions.LoginAttemptLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.AddPolicy(RateLimitPolicies.PerUser, context =>
    {
        var userId = context.User.GetUserId()?.ToString() ?? "anonymous";
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var key = $"{userId}:{ip}";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            Window = TimeSpan.FromMinutes(1),
            PermitLimit = rateLimitOptions.PerUserRequestLimit,
            QueueLimit = 0
        });
    });

    options.AddPolicy(RateLimitPolicies.Expensive, context =>
    {
        var userId = context.User.GetUserId()?.ToString() ?? "anonymous";
        return RateLimitPartition.GetTokenBucketLimiter(userId, _ => new TokenBucketRateLimiterOptions
        {
            TokenLimit = rateLimitOptions.ExpensiveTokenLimit,
            TokensPerPeriod = rateLimitOptions.ExpensiveTokensPerPeriod,
            ReplenishmentPeriod = TimeSpan.FromSeconds(rateLimitOptions.ExpensiveReplenishmentSeconds),
            AutoReplenishment = true,
            QueueLimit = 0
        });
    });

    // BUG-032 / H-32: tell the client when it may retry.
    //
    // The 429 answers used to be empty, with no `Retry-After` header, so a client
    // that polled too fast had no way to know how long to wait and simply retried,
    // which kept the bucket empty. The header does not relax the policy in any way:
    // the limits above stay exactly as they are.
    options.OnRejected = async (context, cancellationToken) =>
    {
        TimeSpan retryAfter;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var metadata))
        {
            retryAfter = metadata;
        }
        else
        {
            // Fallback: the `Expensive` bucket refills one token per replenishment
            // period, so that is the earliest a rejected request could succeed.
            retryAfter = TimeSpan.FromSeconds(rateLimitOptions.ExpensiveReplenishmentSeconds);
        }

        var seconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));

        context.HttpContext.Response.Headers.RetryAfter = seconds.ToString(CultureInfo.InvariantCulture);
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status429TooManyRequests,
            Title = "Demasiadas solicitudes",
            Detail = $"Se alcanzó el límite de solicitudes. Intentá de nuevo en {seconds} s.",
            Instance = context.HttpContext.Request.Path
        };
        problem.Extensions["retryAfterSeconds"] = seconds;

        await context.HttpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
    };
});

// ---- Error handling (ProblemDetails) ------------------------------------
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// ---- OpenAPI + Scalar (no Swashbuckle) ----------------------------------
builder.Services.AddOpenApi(OpenApiConfiguration.Configure);

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

// OpenAPI document + Scalar UI
app.MapOpenApi();
app.MapScalarApiReference();

app.MapAuthEndpoints();
app.MapTicketEndpoints();
app.MapDashboardEndpoints();
app.MapGroupEndpoints();
app.MapChannelEndpoints();
app.MapPreferencesEndpoints();
app.MapServicesEndpoints();

app.MapHub<TicketHub>("/hubs/tickets").RequireAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithTags("Health")
    .AllowAnonymous();

app.MapGet("/health/ready", async (
    IDbConnectionFactory mariaDbFactory,
    IAppDbConnectionFactory appDbFactory,
    ILogger<Program> logger,
    CancellationToken ct) =>
{
    var checks = new Dictionary<string, bool>();
    var allOk = true;

    // MariaDB check
    try
    {
        await using var conn = (MySqlConnection)mariaDbFactory.CreateConnection();
        await conn.OpenAsync(ct);
        await using var cmd = new MySqlCommand("SELECT 1", conn);
        await cmd.ExecuteScalarAsync(ct);
        checks["mariadb"] = true;
    }
    catch (Exception ex)
    {
        checks["mariadb"] = false;
        allOk = false;
        logger.LogError(ex, "Health check failed: MariaDB");
    }

    // PostgreSQL check
    try
    {
        await using var conn = (NpgsqlConnection)await appDbFactory.CreateAsync(ct);
        await using var cmd = new NpgsqlCommand("SELECT 1", conn);
        await cmd.ExecuteScalarAsync(ct);
        checks["postgresql"] = true;
    }
    catch (Exception ex)
    {
        checks["postgresql"] = false;
        allOk = false;
        logger.LogError(ex, "Health check failed: PostgreSQL");
    }

    var response = new
    {
        status = allOk ? "ready" : "not ready",
        checks
    };

    return allOk
        ? Results.Ok(response)
        : Results.Json(response, statusCode: 503);
})
.WithTags("Health")
.AllowAnonymous();

app.Run();

/// <summary>Exposed so integration tests can reference the entry point assembly.</summary>
public partial class Program;
