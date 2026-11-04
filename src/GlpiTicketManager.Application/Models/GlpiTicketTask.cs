namespace GlpiTicketManager.Application.Models;

/// <summary>
/// A ticket task as GLPI reports it through the REST API.
/// </summary>
/// <remarks>
/// Field names are the ones the legacy <c>apirest.php</c> contract of the installed
/// GLPI 11.0.11 actually uses (verified against the live instance and against
/// <c>glpi_tickettasks</c>): <c>tickets_id</c>, <c>content</c>, <c>users_id_tech</c>,
/// <c>begin</c>, <c>end</c>, <c>actiontime</c>, <c>state</c>, <c>uuid</c>.
/// </remarks>
public sealed record GlpiTicketTask(
    int Id,
    string? Uuid,
    int TicketId,
    string Content,
    int State,
    DateTime? Begin,
    DateTime? End,
    int ActionTime,
    int TechnicianId,
    int GroupId,
    bool IsPrivate,
    DateTime? CreatedAt,
    DateTime? UpdatedAt);
