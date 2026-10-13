namespace GlpiTicketManager.Application.Models;

/// <summary>
/// A page of results plus the total number of matching rows.
/// </summary>
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    long Total,
    int Limit,
    int Offset);
