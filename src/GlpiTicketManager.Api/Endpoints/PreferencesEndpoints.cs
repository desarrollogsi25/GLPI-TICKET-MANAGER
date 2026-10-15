using System.Security.Claims;
using GlpiTicketManager.Api.Auth;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Dtos.Preferences;
using GlpiTicketManager.Application.Exceptions;

namespace GlpiTicketManager.Api.Endpoints;

public static class PreferencesEndpoints
{
    public static IEndpointRouteBuilder MapPreferencesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/preferences")
            .WithTags("Preferences")
            .RequireAuthorization();

        group.MapGet("/", Get).WithName("GetUserPreferences");
        group.MapPut("/", Update).WithName("UpdateUserPreferences");

        return app;
    }

    private static async Task<IResult> Get(
        IUserPreferencesRepository repository,
        ClaimsPrincipal principal,
        CancellationToken ct)
    {
        var userId = principal.GetUserId();
        if (userId is null) return Results.Unauthorized();

        var pref = await repository.GetAsync(userId.Value, ct);
        // Si no existe, devolver defaults
        return pref is null
            ? Results.Ok(new UserPreferencesDto { Prefs = "{}" })
            : Results.Ok(new UserPreferencesDto { Prefs = pref.Prefs });
    }

    private static async Task<IResult> Update(
        UpdateUserPreferencesRequest request,
        IUserPreferencesRepository repository,
        ClaimsPrincipal principal,
        CancellationToken ct)
    {
        var userId = principal.GetUserId();
        if (userId is null) return Results.Unauthorized();

        // Validar que Prefs sea JSON válido
        if (string.IsNullOrWhiteSpace(request.Prefs))
        {
            throw new ValidationException("Prefs", "Prefs cannot be empty.");
        }

        if (request.Prefs.Length > 8192) // 8KB máximo
        {
            throw new ValidationException("Prefs", "Prefs exceeds 8KB limit.");
        }

        try
        {
            System.Text.Json.JsonDocument.Parse(request.Prefs);
        }
        catch (System.Text.Json.JsonException)
        {
            throw new ValidationException("Prefs", "Prefs must be valid JSON.");
        }

        await repository.UpsertAsync(userId.Value, request.Prefs, ct);
        return Results.NoContent();
    }
}
