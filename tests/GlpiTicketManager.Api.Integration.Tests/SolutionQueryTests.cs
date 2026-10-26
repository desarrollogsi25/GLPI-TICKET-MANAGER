using FluentAssertions;
using GlpiTicketManager.Infrastructure.Persistence.Queries;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

/// <summary>
/// BUG-031 (H-31) — guard against reintroducing the divergence between the production
/// query and the API validation.
///
/// The defect was invisible to the test suite because the in-memory repository double
/// answered "a solution exists" for any non-empty content, while the production query
/// required at least 10 characters. The API never enforced that minimum, so a technician
/// writing "OK" got a 201 for the solution and a 422 for the status change.
/// </summary>
public class SolutionQueryTests
{
    [Fact]
    public void ExistsQuery_DoesNotRequireAMinimumLength()
    {
        // The API only rejects empty content and content over 2000 characters, and the UI
        // explicitly allows short solutions ("OK", "Listo"). A minimum length here made a
        // written solution invisible to the status-transition guard.
        SolutionQueries.Exists.Should().NotContain("CHAR_LENGTH");
    }

    [Fact]
    public void ExistsQuery_RequiresANonEmptyContent()
    {
        SolutionQueries.Exists.Should().Contain("TRIM(content) <> ''");
    }

    [Fact]
    public void ExistsQuery_IgnoresObsoleteSolutions()
    {
        // status = 4 marks an obsolete/historical solution: it must not satisfy the guard.
        SolutionQueries.Exists.Should().Contain("status <> 4");
    }
}
