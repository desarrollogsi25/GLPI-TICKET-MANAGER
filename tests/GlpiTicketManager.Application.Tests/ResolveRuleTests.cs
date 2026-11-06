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
        // Case 3 & 6: Completed task evidence of work done, or reopened ticket
        var result = ResolveRule.Evaluate(2, new[] { Task(ResolveRule.TaskDone) });
        Assert.True(result.CanResolve);
        Assert.Equal("completed_task", result.Code);
    }

    [Fact]
    public void Assigned_ticket_without_tasks_can_be_resolved_directly()
    {
        // Case 1: Direct resolution by assigned technician
        var none = ResolveRule.Evaluate(2, Array.Empty<TicketTaskDto>());
        Assert.True(none.CanResolve);
        Assert.Equal("direct", none.Code);

        var infoOnly = ResolveRule.Evaluate(2, new[] { Task(ResolveRule.TaskInformation) });
        Assert.True(infoOnly.CanResolve);
    }

    [Fact]
    public void When_glpi_tasks_cannot_be_retrieved_evaluate_fails_closed()
    {
        // Case 8: GLPI communication error must NOT allow resolution
        var result = ResolveRule.Evaluate(2, null);
        Assert.False(result.CanResolve);
        Assert.Equal("glpi_error", result.Code);
        Assert.Contains("error de comunicación", result.Reason);
    }
}
