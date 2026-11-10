using FluentAssertions;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Application.Services;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace GlpiTicketManager.Application.Tests.Services;

public sealed class TicketPlanningServiceTests
{
    private sealed class ScheduleLease : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
    private readonly Mock<ITicketPlanningRequestStore> _scheduleRequests = new();
    private readonly Mock<ITicketRepository> _tickets = new();
    private readonly Mock<ITicketTaskRepository> _tasks = new();
    private readonly Mock<IPlanningIdempotencyRepository> _idempotency = new();
    private readonly Mock<IGlpiApiClient> _glpi = new();
    private readonly Mock<ITicketAccessPolicy> _policy = new();
    private readonly TicketPlanningService _service;

    public TicketPlanningServiceTests()
    {
        _scheduleRequests.Setup(store => store.AcquireTechnicianScheduleLockAsync(
            It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync(new ScheduleLease());
        _service = new TicketPlanningService(
            _tickets.Object,
            _tasks.Object,
            _idempotency.Object,
            _glpi.Object,
            _policy.Object,
            TimeProvider.System,
            NullLogger<TicketPlanningService>.Instance, _scheduleRequests.Object);
    }

    [Fact]
    public async Task GetAvailabilityAsync_DeniesUnauthorizedTechnicianBeforeReadingConflicts()
    {
        _policy.Setup(p => p.CanViewAsync(20, AppRole.Technician, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _tickets.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 100, Status = (int)TicketStatus.Assigned });
        _policy.Setup(p => p.CanPlanAsync(20, AppRole.Technician, 100, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var act = () => _service.GetAvailabilityAsync(
            100,
            30,
            DateTimeOffset.UtcNow.AddHours(1),
            DateTimeOffset.UtcNow.AddHours(2),
            20,
            AppRole.Technician,
            CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
        _tasks.Verify(
            r => r.GetConflictsAsync(
                It.IsAny<int>(),
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task PlanAsync_RejectsIdempotencyKeyReusedWithDifferentPayloadBeforeGlpiWrite()
    {
        var begin = DateTimeOffset.UtcNow.AddHours(1);
        var end = begin.AddHours(1);
        _policy.Setup(p => p.CanPlanAsync(20, AppRole.Technician, 100, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _tickets.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 100, Status = (int)TicketStatus.Assigned });
        _idempotency.Setup(r => r.AcquireAsync(
                "operation-1",
                100,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningReservation(
                PlanningReservationDisposition.PayloadConflict,
                100,
                "different-hash",
                null));

        var act = () => _service.PlanAsync(
            100,
            new PlanTicketRequest("Intervención", 30, begin, end, null, "UTC", "operation-1"),
            20,
            AppRole.Technician,
            CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
        _glpi.Verify(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_ReturnsPreviouslyCompletedReservationWithoutCreatingAnotherTask()
    {
        var begin = DateTime.UtcNow.AddHours(1);
        var end = begin.AddHours(1);
        const string key = "operation-2";
        var existing = new GlpiTicketTask(
            88, key, 100, "Intervención", 1, begin, end, 3600, 30, 0, false, null, null);
        _policy.Setup(p => p.CanPlanAsync(20, AppRole.Technician, 100, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _policy.Setup(p => p.CanSeePrivateFollowupsAsync(20, AppRole.Technician, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _tickets.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 100, Status = (int)TicketStatus.Assigned });
        _idempotency.Setup(r => r.AcquireAsync(key, 100, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningReservation(PlanningReservationDisposition.Completed, 100, "hash", existing.Id));
        _glpi.SetupSequence(g => g.GetGlpiTicketTasksAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { existing })
            .ReturnsAsync(new[] { existing });
        _glpi.Setup(g => g.GetTicketStateAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(100, (int)TicketStatus.Planned));

        var result = await _service.PlanAsync(
            100,
            new PlanTicketRequest(
                "Intervención",
                30,
                new DateTimeOffset(begin, TimeSpan.Zero),
                new DateTimeOffset(end, TimeSpan.Zero),
                null,
                "UTC",
                key),
            20,
            AppRole.Technician,
            CancellationToken.None);

        result.Status.Should().Be((int)TicketStatus.Planned);
        result.Tasks.Should().ContainSingle(task => task.Id == existing.Id);
        _glpi.Verify(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_ConcurrentInstanceAdoptsTheTaskAlreadyCreatedWithTheSameKey()
    {
        var begin = DateTime.UtcNow.AddHours(1);
        var end = begin.AddHours(1);
        const string key = "operation-3";
        var existing = new GlpiTicketTask(
            89, key, 100, "Intervención", 1, begin, end, 3600, 30, 0, false, null, null);
        _policy.Setup(p => p.CanPlanAsync(20, AppRole.Technician, 100, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _policy.Setup(p => p.CanSeePrivateFollowupsAsync(20, AppRole.Technician, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _tickets.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 100, Status = (int)TicketStatus.Assigned });
        _idempotency.Setup(r => r.AcquireAsync(key, 100, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningReservation(PlanningReservationDisposition.InProgress, 100, "hash", null));
        _glpi.SetupSequence(g => g.GetGlpiTicketTasksAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<GlpiTicketTask>())
            .ReturnsAsync(new[] { existing })
            .ReturnsAsync(new[] { existing })
            .ReturnsAsync(new[] { existing });
        _glpi.Setup(g => g.GetTicketStateAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(100, (int)TicketStatus.Planned));

        var result = await _service.PlanAsync(
            100,
            new PlanTicketRequest(
                "Intervención",
                30,
                new DateTimeOffset(begin, TimeSpan.Zero),
                new DateTimeOffset(end, TimeSpan.Zero),
                null,
                "UTC",
                key),
            20,
            AppRole.Technician,
            CancellationToken.None);

        result.Tasks.Should().ContainSingle(task => task.Id == existing.Id);
        _idempotency.Verify(r => r.CompleteAsync(key, 100, It.IsAny<string>(), existing.Id, It.IsAny<CancellationToken>()), Times.Once);
        _glpi.Verify(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_TwoServiceInstancesSubmittingTheSameOperationCreateOneGlpiTask()
    {
        var begin = DateTime.UtcNow.AddHours(1);
        var end = begin.AddHours(1);
        const string key = "operation-concurrent";
        var glpiTasks = new List<GlpiTicketTask>();
        var glpiTasksLock = new object();
        var createStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var releaseCreate = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var secondLookupStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var reservationCount = 0;
        var taskLookupCount = 0;

        _policy.Setup(p => p.CanPlanAsync(20, AppRole.Technician, 100, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _policy.Setup(p => p.CanSeePrivateFollowupsAsync(20, AppRole.Technician, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _tickets.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 100, Status = (int)TicketStatus.Assigned });
        _tasks.Setup(r => r.GetConflictsAsync(30, It.IsAny<DateTime>(), It.IsAny<DateTime>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketTask>());
        _idempotency.Setup(r => r.AcquireAsync(key, 100, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new PlanningReservation(
                Interlocked.Increment(ref reservationCount) == 1
                    ? PlanningReservationDisposition.Acquired
                    : PlanningReservationDisposition.InProgress,
                100,
                "same-payload",
                null));
        _idempotency.Setup(r => r.CompleteAsync(key, 100, It.IsAny<string>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        _glpi.Setup(g => g.GetGlpiTicketTasksAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                lock (glpiTasksLock)
                {
                    if (glpiTasks.Count == 0 && Interlocked.Increment(ref taskLookupCount) >= 2)
                    {
                        secondLookupStarted.TrySetResult();
                    }

                    return (IReadOnlyList<GlpiTicketTask>)glpiTasks.ToArray();
                }
            });
        _glpi.Setup(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()))
            .Returns(async (CreateTicketTaskRequest request, CancellationToken _) =>
            {
                createStarted.TrySetResult();
                await releaseCreate.Task;
                var created = new GlpiTicketTask(
                    92, request.Uuid, request.TicketId, request.Content, 1,
                    request.BeginUtc, request.EndUtc,
                    (int)(request.EndUtc - request.BeginUtc).TotalSeconds,
                    request.TechnicianId, 0, request.IsPrivate, null, null);
                lock (glpiTasksLock)
                {
                    glpiTasks.Add(created);
                }

                return created;
            });
        _glpi.Setup(g => g.GetTicketStateAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(100, (int)TicketStatus.Planned));

        var secondServiceInstance = new TicketPlanningService(
            _tickets.Object,
            _tasks.Object,
            _idempotency.Object,
            _glpi.Object,
            _policy.Object,
            TimeProvider.System,
            NullLogger<TicketPlanningService>.Instance, _scheduleRequests.Object);
        var request = new PlanTicketRequest(
            "Intervención", 30,
            new DateTimeOffset(begin, TimeSpan.Zero),
            new DateTimeOffset(end, TimeSpan.Zero),
            null, "UTC", key);

        var first = _service.PlanAsync(100, request, 20, AppRole.Technician, CancellationToken.None);
        await createStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        var second = secondServiceInstance.PlanAsync(100, request, 20, AppRole.Technician, CancellationToken.None);
        await secondLookupStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        releaseCreate.TrySetResult();
        var results = await Task.WhenAll(first, second).WaitAsync(TimeSpan.FromSeconds(5));

        results.Should().OnlyContain(result => result.Tasks.Count == 1 && result.Tasks[0].Id == 92);
        _glpi.Verify(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        _idempotency.Verify(r => r.CompleteAsync(key, 100, It.IsAny<string>(), 92, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task PlanAsync_TimeoutAfterGlpiCreationReconcilesBeforeRetrying()
    {
        var begin = DateTime.UtcNow.AddHours(1);
        var end = begin.AddHours(1);
        const string key = "operation-4";
        var existing = new GlpiTicketTask(
            90, key, 100, "Intervención", 1, begin, end, 3600, 30, 0, false, null, null);
        _policy.Setup(p => p.CanPlanAsync(20, AppRole.Technician, 100, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _policy.Setup(p => p.CanSeePrivateFollowupsAsync(20, AppRole.Technician, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _tickets.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 100, Status = (int)TicketStatus.Assigned });
        _tasks.Setup(r => r.GetConflictsAsync(30, It.IsAny<DateTime>(), It.IsAny<DateTime>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketTask>());
        _idempotency.Setup(r => r.AcquireAsync(key, 100, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningReservation(PlanningReservationDisposition.Acquired, 100, "hash", null));
        _glpi.Setup(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TaskCanceledException("simulated response timeout after GLPI committed"));
        _glpi.SetupSequence(g => g.GetGlpiTicketTasksAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<GlpiTicketTask>())
            .ReturnsAsync(new[] { existing })
            .ReturnsAsync(new[] { existing })
            .ReturnsAsync(new[] { existing });
        _glpi.Setup(g => g.GetTicketStateAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(100, (int)TicketStatus.Planned));

        var result = await _service.PlanAsync(
            100,
            new PlanTicketRequest(
                "Intervención", 30,
                new DateTimeOffset(begin, TimeSpan.Zero),
                new DateTimeOffset(end, TimeSpan.Zero),
                null, "UTC", key),
            20,
            AppRole.Technician,
            CancellationToken.None);

        result.Tasks.Should().ContainSingle(task => task.Id == existing.Id);
        _glpi.Verify(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        _idempotency.Verify(r => r.CompleteAsync(key, 100, It.IsAny<string>(), existing.Id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Theory]
    [InlineData(429)]
    [InlineData(500)]
    public async Task PlanAsync_RetryableGlpiResponsesRetryWithTheSameKey(int statusCode)
    {
        var begin = DateTime.UtcNow.AddHours(1);
        var end = begin.AddHours(1);
        const string key = "operation-5";
        var created = new GlpiTicketTask(
            91, key, 100, "Intervención", 1, begin, end, 3600, 30, 0, false, null, null);
        _policy.Setup(p => p.CanPlanAsync(20, AppRole.Technician, 100, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _policy.Setup(p => p.CanSeePrivateFollowupsAsync(20, AppRole.Technician, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _tickets.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 100, Status = (int)TicketStatus.Assigned });
        _tasks.Setup(r => r.GetConflictsAsync(30, It.IsAny<DateTime>(), It.IsAny<DateTime>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketTask>());
        _idempotency.Setup(r => r.AcquireAsync(key, 100, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningReservation(PlanningReservationDisposition.Acquired, 100, "hash", null));
        _glpi.SetupSequence(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new GlpiApiException(statusCode, "temporary error", "temporary error"))
            .ReturnsAsync(created);
        _glpi.SetupSequence(g => g.GetGlpiTicketTasksAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<GlpiTicketTask>())
            .ReturnsAsync(Array.Empty<GlpiTicketTask>())
            .ReturnsAsync(new[] { created });
        _glpi.Setup(g => g.GetTicketStateAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(100, (int)TicketStatus.Planned));

        var result = await _service.PlanAsync(
            100,
            new PlanTicketRequest(
                "Intervención", 30,
                new DateTimeOffset(begin, TimeSpan.Zero),
                new DateTimeOffset(end, TimeSpan.Zero),
                null, "UTC", key),
            20,
            AppRole.Technician,
            CancellationToken.None);

        result.Tasks.Should().ContainSingle(task => task.Id == created.Id);
        _glpi.Verify(g => g.CreateTicketTaskAsync(It.IsAny<CreateTicketTaskRequest>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task GetAvailabilityAsync_DoesNotReturnIdentifiersForOtherTickets()
    {
        _policy.Setup(p => p.CanViewAsync(20, AppRole.Supervisor, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _tickets.Setup(r => r.GetByIdAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 100, Status = (int)TicketStatus.Assigned });
        _policy.Setup(p => p.CanPlanAsync(20, AppRole.Supervisor, 100, 30, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _tasks.Setup(r => r.GetConflictsAsync(
                30,
                It.IsAny<DateTime>(),
                It.IsAny<DateTime>(),
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new TicketTask
                {
                    Id = 900,
                    TicketId = 901,
                    TechnicianId = 30,
                    Begin = DateTime.UtcNow.AddHours(1),
                    End = DateTime.UtcNow.AddHours(2)
                }
            });

        var result = await _service.GetAvailabilityAsync(
            100,
            30,
            DateTimeOffset.UtcNow.AddHours(1),
            DateTimeOffset.UtcNow.AddHours(2),
            20,
            AppRole.Supervisor,
            CancellationToken.None);

        result.Available.Should().BeFalse();
        result.Conflicts.Should().BeEmpty();
        result.Message.Should().Be("El técnico no está disponible en ese intervalo.");
        result.Message.Should().NotContain("900").And.NotContain("901");
    }

    [Fact]
    public async Task GetPlanningAsync_HidesPrivateTasksAndDerivedScheduleFromRequester()
    {
        var privateBegin = DateTime.UtcNow.AddHours(1);
        var publicBegin = DateTime.UtcNow.AddHours(3);
        _policy.Setup(p => p.CanViewAsync(40, AppRole.Solicitante, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _policy.Setup(p => p.CanSeePrivateFollowupsAsync(40, AppRole.Solicitante, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _glpi.Setup(g => g.GetTicketStateAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(100, (int)TicketStatus.Planned));
        _glpi.Setup(g => g.GetGlpiTicketTasksAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new GlpiTicketTask(1, null, 100, "private content", 1, privateBegin, privateBegin.AddHours(1), 3600, 31, 0, true, null, null),
                new GlpiTicketTask(2, null, 100, "public content", 1, publicBegin, publicBegin.AddHours(1), 3600, 32, 0, false, null, null)
            });

        var result = await _service.GetPlanningAsync(100, 40, AppRole.Solicitante, CancellationToken.None);

        result.Tasks.Should().HaveCount(1);
        var visibleTask = result.Tasks.Single();
        visibleTask.Id.Should().Be(2);
        visibleTask.Content.Should().Be("public content");
        visibleTask.IsPrivate.Should().BeFalse();
        result.NextPlannedAt.Should().Be(publicBegin);
        result.NextPlannedTechnicianId.Should().Be(32);
    }

    [Fact]
    public async Task GetPlanningAsync_ShowsPrivateTasksToAuthorizedAssignedTechnician()
    {
        var privateBegin = DateTime.UtcNow.AddHours(1);
        _policy.Setup(p => p.CanViewAsync(31, AppRole.Technician, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _policy.Setup(p => p.CanSeePrivateFollowupsAsync(31, AppRole.Technician, 100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _glpi.Setup(g => g.GetTicketStateAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(100, (int)TicketStatus.Planned));
        _glpi.Setup(g => g.GetGlpiTicketTasksAsync(100, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new GlpiTicketTask(1, null, 100, "private content", 1, privateBegin, privateBegin.AddHours(1), 3600, 31, 0, true, null, null)
            });

        var result = await _service.GetPlanningAsync(100, 31, AppRole.Technician, CancellationToken.None);

        result.Tasks.Should().ContainSingle().Which.Content.Should().Be("private content");
        result.NextPlannedAt.Should().Be(privateBegin);
        result.NextPlannedTechnicianId.Should().Be(31);
    }
}
