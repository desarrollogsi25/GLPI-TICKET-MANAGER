using GlpiTicketManager.Domain.Entities;

namespace GlpiTicketManager.Application.Abstractions;

/// <summary>
/// Read-side access to GLPI users.
/// </summary>
public interface IUserRepository
{
    Task<UserAccount?> GetByNameAsync(string username, CancellationToken cancellationToken);
}
