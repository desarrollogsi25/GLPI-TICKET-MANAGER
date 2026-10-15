using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Threading.RateLimiting;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Api.Configuration;
using GlpiTicketManager.Api.Endpoints;
using GlpiTicketManager.Api.Exceptions;
using GlpiTicketManager.Api.OpenApi;
using GlpiTicketManager.Api.RateLimiting;
using GlpiTicketManager.Application;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Infrastructure;
using GlpiTicketManager.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        options.Events = new JwtBearerEvents
        {
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

// ---- Rate limiting (native .NET 9) --------------------------------------
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy(RateLimitPolicies.Login, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

// ---- Error handling (ProblemDetails) ------------------------------------
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// ---- OpenAPI + Scalar (no Swashbuckle) ----------------------------------
builder.Services.AddOpenApi(OpenApiConfiguration.Configure);

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.UseRateLimiter();
app.UseAuthentication();
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

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithTags("Health")
    .AllowAnonymous();

app.MapGet("/health/ready", async (
    IDbConnectionFactory mariaDbFactory,
    IAppDbConnectionFactory appDbFactory,
    CancellationToken ct) =>
{
    var checks = new Dictionary<string, string>();
    var allOk = true;

    // MariaDB check
    try
    {
        await using var conn = (MySqlConnection)mariaDbFactory.CreateConnection();
        await conn.OpenAsync(ct);
        await using var cmd = new MySqlCommand("SELECT 1", conn);
        await cmd.ExecuteScalarAsync(ct);
        checks["mariadb"] = "ok";
    }
    catch (Exception ex)
    {
        checks["mariadb"] = $"error: {ex.Message}";
        allOk = false;
    }

    // PostgreSQL check
    try
    {
        await using var conn = (NpgsqlConnection)await appDbFactory.CreateAsync(ct);
        await using var cmd = new NpgsqlCommand("SELECT 1", conn);
        await cmd.ExecuteScalarAsync(ct);
        checks["postgresql"] = "ok";
    }
    catch (Exception ex)
    {
        checks["postgresql"] = $"error: {ex.Message}";
        allOk = false;
    }

    return allOk
        ? Results.Ok(new { status = "ready", checks })
        : Results.Json(new { status = "not ready", checks }, statusCode: 503);
})
.WithTags("Health")
.AllowAnonymous();

app.Run();

/// <summary>Exposed so integration tests can reference the entry point assembly.</summary>
public partial class Program;
