using Dapper;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Domain.Enums;
using GlpiTicketManager.Infrastructure.Persistence;

namespace GlpiTicketManager.Infrastructure.Repositories;

public sealed class UserRoleRepository : IUserRoleResolver
{
    private readonly IAppDbConnectionFactory _appDbFactory;
    private readonly IDbConnectionFactory _mariaDbFactory;

    public UserRoleRepository(IAppDbConnectionFactory appDbFactory, IDbConnectionFactory mariaDbFactory)
    {
        _appDbFactory = appDbFactory;
        _mariaDbFactory = mariaDbFactory;
    }

    public async Task<AppRole> ResolveAsync(int userId, CancellationToken ct = default)
    {
        // 1. Check user_role_overrides in PostgreSQL (app-db)
        using (var appConn = await _appDbFactory.CreateAsync(ct))
        {
            var overrideRole = await appConn.QueryFirstOrDefaultAsync<string>(
                new CommandDefinition(
                    "SELECT app_role FROM user_role_overrides WHERE user_id = @UserId LIMIT 1;",
                    new { UserId = userId },
                    cancellationToken: ct));

            if (!string.IsNullOrEmpty(overrideRole))
            {
                var roleFromOverride = AppRoleExtensions.FromClaimValue(overrideRole);
                if (roleFromOverride.HasValue)
                {
                    return roleFromOverride.Value;
                }
            }
        }

        // 2. Query GLPI profiles for user in MariaDB
        IReadOnlyList<int> profileIds;
        using (var mariaConn = _mariaDbFactory.CreateConnection())
        {
            var rows = await mariaConn.QueryAsync<int>(
                new CommandDefinition(
                    "SELECT profiles_id FROM glpi_profiles_users WHERE users_id = @UserId;",
                    new { UserId = userId },
                    cancellationToken: ct));

            profileIds = rows.AsList();
        }

        if (profileIds.Count == 0)
        {
            return AppRole.Technician;
        }

        // 3. Resolve role from role_profile_mapping in PostgreSQL (app-db)
        using (var appConn = await _appDbFactory.CreateAsync(ct))
        {
            var roles = (await appConn.QueryAsync<string>(
                new CommandDefinition(
                    "SELECT app_role FROM role_profile_mapping WHERE glpi_profile_id = ANY(@ProfileIds);",
                    new { ProfileIds = profileIds.ToArray() },
                    cancellationToken: ct))).AsList();

            if (roles.Contains("admin", StringComparer.OrdinalIgnoreCase))
            {
                return AppRole.Admin;
            }

            if (roles.Contains("supervisor", StringComparer.OrdinalIgnoreCase))
            {
                return AppRole.Supervisor;
            }

            if (roles.Contains("technician", StringComparer.OrdinalIgnoreCase))
            {
                return AppRole.Technician;
            }

            if (roles.Contains("solicitante", StringComparer.OrdinalIgnoreCase) ||
                roles.Contains("requester", StringComparer.OrdinalIgnoreCase))
            {
                return AppRole.Solicitante;
            }
        }

        if (profileIds.Contains(1))
        {
            return AppRole.Solicitante;
        }

        return AppRole.Technician;
    }
}
