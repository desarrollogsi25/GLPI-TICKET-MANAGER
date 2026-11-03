using GlpiTicketManager.Domain.Enums;

namespace GlpiTicketManager.Application.Mapping;

/// <summary>
/// Human-readable labels for GLPI numeric codes.
/// </summary>
public static class TicketLabels
{
    public static string Status(int status) => (TicketStatus)status switch
    {
        TicketStatus.New => "Nuevo",
        TicketStatus.Assigned => "En proceso (asignado)",
        TicketStatus.Planned => "En proceso (planificado)",
        TicketStatus.Waiting => "Pendiente",
        TicketStatus.Solved => "Resuelto",
        TicketStatus.Closed => "Cerrado",
        _ => $"Desconocido ({status})"
    };

    public static string TaskState(int state) => (TicketTaskState)state switch
    {
        TicketTaskState.ToDo => "Pendiente",
        TicketTaskState.Done => "Realizada",
        _ => $"Desconocido ({state})"
    };

    public static string Type(int type) => (TicketType)type switch
    {
        TicketType.Incident => "Incidente",
        TicketType.Request => "Solicitud",
        _ => $"Desconocido ({type})"
    };

    public static string Priority(int priority) => (TicketPriority)priority switch
    {
        TicketPriority.VeryLow => "Muy baja",
        TicketPriority.Low => "Baja",
        TicketPriority.Medium => "Media",
        TicketPriority.High => "Alta",
        TicketPriority.VeryHigh => "Muy alta",
        TicketPriority.Major => "Crítica",
        _ => $"Desconocida ({priority})"
    };
}
