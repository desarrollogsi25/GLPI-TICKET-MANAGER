namespace GlpiTicketManager.Application.Models;

/// <summary>
/// Payload used to create a scheduled task through the GLPI REST API.
/// </summary>
/// <remarks>
/// <para>
/// The schedule is sent as GLPI's <c>plan</c> object instead of raw <c>begin</c>/<c>end</c>
/// columns: that path runs <c>CommonITILTask::prepareInputForAdd()</c>, which validates
/// the range and derives <c>actiontime</c> from it. Sending the raw columns skips that
/// validation entirely.
/// </para>
/// <para>
/// Dates are absolute UTC instants. GLPI stores timestamps in UTC, so the conversion
/// happens once, here, from the ISO-8601 value the client sent.
/// </para>
/// </remarks>
public sealed record CreateTicketTaskRequest(
    int TicketId,
    string Content,
    int TechnicianId,
    DateTime BeginUtc,
    DateTime EndUtc,
    bool IsPrivate,
    string Uuid);
