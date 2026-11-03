namespace GlpiTicketManager.Application.Models;

/// <summary>
/// Payload used to modify a task through the GLPI REST API. A null member is left
/// untouched; GLPI only writes the fields that actually change.
/// </summary>
public sealed record UpdateTicketTaskRequest(
    string? Content = null,
    int? TechnicianId = null,
    DateTime? BeginUtc = null,
    DateTime? EndUtc = null,
    int? State = null,
    bool? IsPrivate = null)
{
    public bool HasScheduleChange => BeginUtc.HasValue || EndUtc.HasValue;
}
