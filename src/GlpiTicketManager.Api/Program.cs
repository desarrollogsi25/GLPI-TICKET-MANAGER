using System.Text;
using System.Threading.RateLimiting;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Api.Configuration;
using GlpiTicketManager.Api.Endpoints;
using GlpiTicketManager.Api.Exceptions;
using GlpiTicketManager.Api.OpenApi;
using GlpiTicketManager.Api.RateLimiting;
using GlpiTicketManager.Application;
using GlpiTicketManager.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
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

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithTags("Health")
    .AllowAnonymous();

app.Run();

/// <summary>Exposed so integration tests can reference the entry point assembly.</summary>
public partial class Program;
