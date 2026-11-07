namespace GlpiTicketManager.Application.Dtos.Tickets;

public sealed record PendingReasonDto(int Id, string Label);

public static class PendingReasons
{
    public static readonly IReadOnlyList<PendingReasonDto> All = new[]
    {
        new PendingReasonDto(1, "Esperando respuesta del usuario"),
        new PendingReasonDto(2, "Esperando pieza / repuesto"),
        new PendingReasonDto(3, "Escalado a otro equipo"),
        new PendingReasonDto(4, "Falta información técnica"),
        new PendingReasonDto(5, "Otros"),
    };

    public static bool IsValid(int reasonId) => All.Any(r => r.Id == reasonId);

    public static PendingReasonDto? GetById(int reasonId) => All.FirstOrDefault(r => r.Id == reasonId);
}
