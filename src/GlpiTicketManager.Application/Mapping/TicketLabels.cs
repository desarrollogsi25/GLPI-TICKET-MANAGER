using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Application.Mapping;

/// <summary>
/// Human-readable labels for GLPI numeric codes.
/// </summary>
public static class TicketLabels
{
    public static string Status(int status) =>
        Enum.IsDefined((TicketStatus)status) ? ((TicketStatus)status).ToString() : $"Unknown ({status})";

    public static string Type(int type) =>
        Enum.IsDefined((TicketType)type) ? ((TicketType)type).ToString() : $"Unknown ({type})";

    public static string Priority(int priority) =>
        Enum.IsDefined((TicketPriority)priority)
            ? ((TicketPriority)priority).ToString()
            : $"Unknown ({priority})";
}
