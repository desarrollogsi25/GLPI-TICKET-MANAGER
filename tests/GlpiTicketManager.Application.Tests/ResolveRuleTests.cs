using GlpiTicketManager.Application.Dtos.Tickets;
using Xunit;

namespace GlpiTicketManager.Application.Tests.Dtos;

public sealed class ResolveRuleTests
{
    private static TicketTaskDto Task(int state) =>
        new(1, 1039, 16, "x", state, false, null, null, 0);

    [Theory]
    [InlineData(6, "closed")]
    [InlineData(5, "already_solved")]
    [InlineData(4, "pending")]
    [InlineData(1, "not_assigned")]
    public void Terminal_pending_and_new_statuses_are_never_resolvable(int status, string code)
    {
        var result = ResolveRule.Evaluate(status, new[] { Task(ResolveRule.TaskDone) });
        Assert.False(result.CanResolve);
        Assert.Equal(code, result.Code);
        Assert.False(string.IsNullOrWhiteSpace(result.Reason));
    }

    [Fact]
    public void Planned_ticket_with_open_task_can_be_resolved()
    {
        var result = ResolveRule.Evaluate(3, new[] { Task(ResolveRule.TaskTodo) });
        Assert.True(result.CanResolve);
        Assert.Equal("open_task", result.Code);
    }

    [Fact]
    public void Assigned_ticket_whose_task_was_completed_can_be_resolved()
    {
        // P2-03: GLPI returns the ticket to Assigned (2) after completing the last task.
        var result = ResolveRule.Evaluate(2, new[] { Task(ResolveRule.TaskDone) });
        Assert.True(result.CanResolve);
        Assert.Equal("completed_task", result.Code);
    }

    [Fact]
    public void Assigned_ticket_without_any_real_task_is_blocked()
    {
        var none = ResolveRule.Evaluate(2, Array.Empty<TicketTaskDto>());
        var infoOnly = ResolveRule.Evaluate(2, new[] { Task(ResolveRule.TaskInformation) });
        Assert.False(none.CanResolve);
        Assert.Equal("no_task", none.Code);
        Assert.False(infoOnly.CanResolve);
    }

    [Fact]
    public void Unknown_task_list_defers_to_status_checks()
    {
        Assert.True(ResolveRule.Evaluate(2, null).CanResolve);
    }
}
