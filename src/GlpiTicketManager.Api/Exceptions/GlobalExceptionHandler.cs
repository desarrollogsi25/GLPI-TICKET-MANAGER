using GlpiTicketManager.Application.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace GlpiTicketManager.Api.Exceptions;

/// <summary>
/// Translates domain exceptions into RFC 7807 ProblemDetails responses:
/// validation errors -> 400, missing GLPI resources -> 404, GLPI failures -> 502.
/// </summary>
public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        int statusCode;
        string title;
        string? detail = null;
        IReadOnlyDictionary<string, string[]>? errors = null;

        switch (exception)
        {
            case Application.Exceptions.ValidationException validation:
                statusCode = StatusCodes.Status400BadRequest;
                title = "Validation failed";
                errors = validation.Errors;
                break;

            case Application.Exceptions.ForbiddenException:
            case UnauthorizedAccessException:
                statusCode = StatusCodes.Status403Forbidden;
                title = "Forbidden";
                detail = exception.Message;
                break;

            case Application.Exceptions.UnprocessableEntityException:
                statusCode = StatusCodes.Status422UnprocessableEntity;
                title = "Solution required";
                detail = exception.Message;
                break;

            case Application.Exceptions.ConflictException:
                statusCode = StatusCodes.Status409Conflict;
                title = "Conflict";
                detail = exception.Message;
                break;

            case Application.Exceptions.NotFoundException:
                statusCode = StatusCodes.Status404NotFound;
                title = "Not found";
                detail = exception.Message;
                break;

            case GlpiApiException glpi when glpi.StatusCode == StatusCodes.Status404NotFound:
                statusCode = StatusCodes.Status404NotFound;
                title = "Resource not found in GLPI";
                detail = glpi.Message;
                break;

            case GlpiApiException glpi:
                statusCode = StatusCodes.Status502BadGateway;
                title = "GLPI API error";
                detail = glpi.Message;
                break;

            default:
                statusCode = StatusCodes.Status500InternalServerError;
                title = "Unexpected error";
                break;
        }

        _logger.LogError(exception, "Request {Method} {Path} failed with status {StatusCode}",
            httpContext.Request.Method, httpContext.Request.Path, statusCode);

        var problem = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        };

        if (errors is not null)
        {
            problem.Extensions["errors"] = errors;
        }

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);

        return true;
    }
}
