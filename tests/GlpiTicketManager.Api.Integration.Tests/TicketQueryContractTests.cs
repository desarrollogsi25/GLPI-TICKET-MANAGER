using FluentAssertions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Domain.Enums;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// Regression contracts for the dashboard SQL. These do not need a database:
/// they pin the predicates that the UI labels depend on.
/// </summary>
public sealed class TicketQueryContractTests
{
    public static TheoryData<DashboardScope?> Scopes => new()
    {
        null,
        new DashboardScope { IsGlobal = true, Role = AppRole.Admin },
        new DashboardScope { Role = AppRole.Supervisor, GroupIds = new[] { 1 } },
        new DashboardScope { Role = AppRole.Technician, UserId = 3 },
    };

    [Theory]
    [MemberData(nameof(Scopes))]
    public void Pending_tickets_count_only_GLPI_status_4(DashboardScope? scope)
    {
        var sql = TicketQueries.BuildDashboardQuery(scope);

        sql.Should().Contain("CASE WHEN t.status = 4 THEN 1 ELSE 0 END), 0) AS SIGNED)                AS PendingTickets");
        sql.Should().NotContain("t.status IN (3,4)");
    }

    [Fact]
    public void CreatedAt_falls_back_to_date_mod_for_GLPI_zero_dates()
    {
        TicketQueries.BaseProjection.Should().Contain(
            "COALESCE(NULLIF(t.date, '0000-00-00 00:00:00'), t.date_mod) AS CreatedAt");
    }
}
