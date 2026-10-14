namespace GlpiTicketManager.Application.Dtos.Tickets;

/// <summary>
/// Payload to create a ticket. Forwarded to the GLPI REST API, not written to the DB directly.
/// </summary>
public sealed record CreateTicketRequest
{
    /// <summary>Ticket title (GLPI <c>name</c>).</summary>
    public string Title { get; init; } = string.Empty;

    /// <summary>Ticket body (GLPI <c>content</c>).</summary>
    public string? Content { get; init; }

    /// <summary>1 = Incident, 2 = Request.</summary>
    public int Type { get; init; } = 1;

    /// <summary>1..6, defaults to 3 (medium).</summary>
    public int Urgency { get; init; } = 3;

    /// <summary>1..6, defaults to 3 (medium).</summary>
    public int Impact { get; init; } = 3;

    public int? CategoryId { get; init; }

    /// <summary>GLPI user id of the requester.</summary>
    public int? RequesterId { get; init; }

    /// <summary>GLPI user id of the assigned technician.</summary>
    public int? AssigneeId { get; init; }

    /// <summary>
    /// GLPI group id to which the ticket is routed when no assignee is set
    /// (queue flow). When null and the ticket is unassigned, the backend
    /// resolves the author's single group or fails if ambiguous.
    /// </summary>
    public int? GroupId { get; init; }

    /// <summary>GLPI requesttype id (channel). Null means GLPI default.</summary>
    public int? RequestTypeId { get; init; }

    /// <summary>When set, the ticket is created for an external requester
    /// (users_id=0 with alternative_email) instead of an internal GLPI user.</summary>
    public string? ExternalRequesterEmail { get; init; }

    public string? ExternalRequesterName { get; init; }

    public string? ExternalRequesterPhone { get; init; }

    public string? ExternalRequesterCompany { get; init; }
}
