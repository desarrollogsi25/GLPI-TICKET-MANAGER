using System.Threading;
using System.Text.Json;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Application.Authorization;
using GlpiTicketManager.Application.Dtos.Tickets;
using GlpiTicketManager.Application.Models;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Application.Services;
using GlpiTicketManager.Domain.Entities;
using GlpiTicketManager.Domain.Enums;
using Moq;
using FluentAssertions;
using Xunit;

using Microsoft.Extensions.Logging;

namespace GlpiTicketManager.Application.Tests.Services;

public class TicketServiceTests
{
    private sealed class EmptyScheduleLease : IAsyncDisposable
    {
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }
    private readonly Mock<ITicketRepository> _repo = new();
    private readonly Mock<IGlpiApiClient> _glpi = new();
    private readonly Mock<IAuditRepository> _audit = new();
    private readonly Mock<ITicketAccessPolicy> _accessPolicy = new();
    private readonly Mock<ITicketNotificationService> _notifications = new();
    private readonly Mock<ILogger<TicketService>> _logger = new();
    private readonly Mock<ITicketPlanningRequestStore> _planningRequests = new();
    private readonly Mock<INotificationService> _inAppNotifications = new();
    private readonly Mock<IDashboardRepository> _dashboard = new();
    private readonly TicketService _svc;

    public TicketServiceTests()
    {
        _planningRequests.Setup(s => s.AcquireTechnicianScheduleLockAsync(
                It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EmptyScheduleLease());
        // Default: the caller passed the identity gate; individual tests override the
        // transition graph through EvaluateStatusTransitionAsync as before.
        _accessPolicy.Setup(p => p.CanAttemptStatusChangeAsync(
                It.IsAny<int>(), It.IsAny<AppRole>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _svc = new TicketService(
            _repo.Object,
            _glpi.Object,
            _audit.Object,
            _accessPolicy.Object,
            _notifications.Object,
            _logger.Object,
            _planningRequests.Object,
            _inAppNotifications.Object,
            _dashboard.Object);
    }

    [Fact]
    public async Task GetByIdAsync_WhenFilteredReadDisappears_DoesNotReturnUnfilteredTicket()
    {
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Status = 1 });
        _repo.Setup(r => r.GetByIdAsync(10, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Ticket?)null);
        _accessPolicy.Setup(p => p.CanViewAsync(40, AppRole.Solicitante, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _accessPolicy.Setup(p => p.CanSeePrivateFollowupsAsync(40, AppRole.Solicitante, 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var result = await _svc.GetByIdAsync(10, 40, AppRole.Solicitante, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenTicketIdInvalid_Throws()
    {
        var act = async () => await _svc.UpdateStatusAsync(0, 2, 7, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusInvalid_Throws400()
    {
        var act = async () => await _svc.UpdateStatusAsync(1, 99, 7, CancellationToken.None);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_CannotSetPlannedWithoutATicketTask()
    {
        var act = () => _svc.UpdateStatusAsync(10, (int)TicketStatus.Planned, 7, CancellationToken.None);

        await act.Should().ThrowAsync<UnprocessableEntityException>().WithMessage("*tarea*");
        _glpi.Verify(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    private static PlanTicketRequest ValidPlan() => new()
    {
        RequestId = Guid.NewGuid(),
        Content = "Revisar servidor",
        StartAt = new DateTimeOffset(2026, 11, 3, 8, 0, 0, TimeSpan.FromHours(-3)),
        EndAt = new DateTimeOffset(2026, 11, 3, 9, 0, 0, TimeSpan.FromHours(-3))
    };

    [Fact]
    public async Task PlanAsync_CreatesNativeTaskAndConfirmsGlpiStatusWithoutStatusPatch()
    {
        var request = ValidPlan();
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Status = 2, AssigneeIds = new[] { 7 } });
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, AppRole.Technician,
                10, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _glpi.SetupSequence(g => g.GetTicketStateAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(10, 2))
            .ReturnsAsync(new GlpiTicketState(10, 2))
            .ReturnsAsync(new GlpiTicketState(10, 3));
        _planningRequests.Setup(s => s.ClaimAsync(request.RequestId, 10, 7,
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningRequestClaim(PlanningRequestState.Started));
        _glpi.Setup(g => g.CreatePlannedTaskAsync(10, 7, "Revisar servidor",
                request.StartAt, request.EndAt, It.IsAny<CancellationToken>()))
            .ReturnsAsync(543);

        var response = await _svc.PlanAsync(10, request, 7, AppRole.Technician, CancellationToken.None);

        response.Should().Be(new PlanTicketResponse(10, 543, 3));
        _planningRequests.Verify(s => s.CompleteAsync(request.RequestId, 543, It.IsAny<CancellationToken>()), Times.Once);
        _audit.Verify(a => a.LogAsync(7, "plan", 10, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        _notifications.Verify(n => n.NotifyTicketStatusChangedAsync(10, 3, 7, It.IsAny<CancellationToken>()), Times.Once);
        _glpi.Verify(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), 3, It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_WhenWaiting_ResumesAssignedBeforeSchedulingNativeTask()
    {
        var request = ValidPlan();
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Status = 4, AssigneeIds = new[] { 7 } });
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, AppRole.Technician,
                10, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());

        var calls = new List<string>();
        _glpi.SetupSequence(g => g.GetTicketStateAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(10, 4))
            .ReturnsAsync(new GlpiTicketState(10, 4))
            .ReturnsAsync(new GlpiTicketState(10, 2))
            .ReturnsAsync(new GlpiTicketState(10, 3));
        _planningRequests.Setup(s => s.ClaimAsync(request.RequestId, 10, 7,
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningRequestClaim(PlanningRequestState.Started));
        _glpi.Setup(g => g.UpdateTicketStatusAsync(10, 2, It.IsAny<CancellationToken>()))
            .Callback(() => calls.Add("resume"))
            .Returns(Task.CompletedTask);
        _glpi.Setup(g => g.CreatePlannedTaskAsync(10, 7, It.IsAny<string>(),
                It.IsAny<DateTimeOffset>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .Callback(() => calls.Add("schedule"))
            .ReturnsAsync(544);

        var response = await _svc.PlanAsync(10, request, 7, AppRole.Technician, CancellationToken.None);

        response.Should().Be(new PlanTicketResponse(10, 544, 3));
        calls.Should().Equal("resume", "schedule");
        _glpi.Verify(g => g.UpdateTicketStatusAsync(10, 3, It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_WhenResumeNotConfirmed_DoesNotCreateTask()
    {
        var request = ValidPlan();
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Status = 4, AssigneeIds = new[] { 7 } });
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, AppRole.Technician,
                10, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _glpi.SetupSequence(g => g.GetTicketStateAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(10, 4))
            .ReturnsAsync(new GlpiTicketState(10, 4))
            .ReturnsAsync(new GlpiTicketState(10, 4));
        _planningRequests.Setup(s => s.ClaimAsync(request.RequestId, 10, 7,
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningRequestClaim(PlanningRequestState.Started));

        var act = () => _svc.PlanAsync(10, request, 7, AppRole.Technician, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*Asignado*");
        _glpi.Verify(g => g.CreatePlannedTaskAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<DateTimeOffset>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_RejectsInvalidDatesBeforeAnyGlpiWrite()
    {
        var request = ValidPlan() with { EndAt = ValidPlan().StartAt.AddHours(-1) };
        var act = () => _svc.PlanAsync(10, request, 7, AppRole.Technician, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
        _planningRequests.VerifyNoOtherCalls();
        _glpi.VerifyNoOtherCalls();
    }

    [Fact]
    public void PlanRequest_RejectsDatesWithoutExplicitZone()
    {
        var payload = """
            {"requestId":"18b64724-cc1d-4aa8-9e66-779c4a20cc40", "content":"Trabajo",
             "startAt":"2026-11-03T08:00:00", "endAt":"2026-11-03T09:00:00Z"}
            """;

        var act = () => JsonSerializer.Deserialize<PlanTicketRequest>(payload,
            new JsonSerializerOptions(JsonSerializerDefaults.Web));

        act.Should().Throw<JsonException>();
    }

    [Fact]
    public async Task PlanAsync_ReplayReturnsExistingTaskWithoutCreatingAnother()
    {
        var request = ValidPlan();
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Status = 3 });
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, AppRole.Technician,
                10, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _glpi.Setup(g => g.GetTicketStateAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(10, 3));
        _planningRequests.Setup(s => s.ClaimAsync(request.RequestId, 10, 7,
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningRequestClaim(PlanningRequestState.Completed, 543));

        var result = await _svc.PlanAsync(10, request, 7, AppRole.Technician, CancellationToken.None);

        result.TaskId.Should().Be(543);
        _glpi.Verify(g => g.CreatePlannedTaskAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<DateTimeOffset>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_DeniedTechnicianCannotCreateTask()
    {
        var request = ValidPlan();
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Status = 2 });
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, AppRole.Technician,
                10, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Deny("No eres el técnico asignado."));

        var act = () => _svc.PlanAsync(10, request, 7, AppRole.Technician, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
        _planningRequests.VerifyNoOtherCalls();
        _glpi.Verify(g => g.CreatePlannedTaskAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<DateTimeOffset>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_InFlightDuplicateNeverCreatesASecondGlpiTask()
    {
        var request = ValidPlan();
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Status = 2 });
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, AppRole.Technician,
                10, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _glpi.Setup(g => g.GetTicketStateAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(10, 2));
        _planningRequests.Setup(s => s.ClaimAsync(request.RequestId, 10, 7,
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningRequestClaim(PlanningRequestState.InProgress));

        var act = () => _svc.PlanAsync(10, request, 7, AppRole.Technician, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*GLPI*");
        _glpi.Verify(g => g.CreatePlannedTaskAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<DateTimeOffset>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task PlanAsync_WhenGlpiDoesNotEnterPlanned_ReportsConflictAndDoesNotSendSuccessEvent()
    {
        var request = ValidPlan();
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Status = 2 });
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, AppRole.Technician,
                10, 3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _glpi.Setup(g => g.GetTicketStateAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GlpiTicketState(10, 2));
        _planningRequests.Setup(s => s.ClaimAsync(request.RequestId, 10, 7,
                It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PlanningRequestClaim(PlanningRequestState.Started));
        _glpi.Setup(g => g.CreatePlannedTaskAsync(10, 7, It.IsAny<string>(),
                It.IsAny<DateTimeOffset>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(543);

        var act = () => _svc.PlanAsync(10, request, 7, AppRole.Technician, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>().WithMessage("*543*");
        _planningRequests.Verify(s => s.CompleteAsync(request.RequestId, 543, It.IsAny<CancellationToken>()), Times.Once);
        _notifications.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusSolvedAndNoSolution_Throws422()
    {
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _repo.Setup(r => r.SolutionExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var act = async () => await _svc.UpdateStatusAsync(10, (int)TicketStatus.Solved, 7, CancellationToken.None);

        await act.Should().ThrowAsync<UnprocessableEntityException>();
        _glpi.Verify(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _audit.Verify(a => a.LogAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenTransitionDenied_Throws403WithReason()
    {
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Deny("Solo un administrador puede cambiar el estado de un ticket resuelto o cerrado."));

        var act = async () => await _svc.UpdateStatusAsync(10, (int)TicketStatus.Assigned, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("Solo un administrador puede cambiar el estado de un ticket resuelto o cerrado.");
        _glpi.Verify(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusSolvedAndHasSolution_DoesNotClose()
    {
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _repo.Setup(r => r.SolutionExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _glpi.Setup(g => g.UpdateTicketStatusAsync(10, It.IsAny<int>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svc.UpdateStatusAsync(10, (int)TicketStatus.Solved, 7, CancellationToken.None);

        result.Should().BeTrue();
        // Resolution preserves the separate GLPI solution-approval/closure step.
        _glpi.Verify(g => g.UpdateTicketStatusAsync(10, (int)TicketStatus.Solved, It.IsAny<CancellationToken>()), Times.Once);
        _glpi.Verify(g => g.UpdateTicketStatusAsync(10, (int)TicketStatus.Closed, It.IsAny<CancellationToken>()), Times.Never);
        _audit.Verify(a => a.LogAsync(7, "resolve", 10, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusSolvedWithSolutionPayload_InsertsSolutionThenUpdatesStatus()
    {
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _accessPolicy.Setup(a => a.CanAddSolutionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Name = "Ticket 10", Status = 2 });
        _glpi.Setup(g => g.CreateSolutionAsync(10, "Solucion provista", It.IsAny<CancellationToken>()))
            .ReturnsAsync(123);
        _glpi.Setup(g => g.UpdateTicketStatusAsync(10, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var result = await _svc.UpdateStatusAsync(10, (int)TicketStatus.Solved, 7, AppRole.Technician, "Solucion provista", CancellationToken.None);

        result.Should().BeTrue();
        _glpi.Verify(g => g.CreateSolutionAsync(10, "Solucion provista", It.IsAny<CancellationToken>()), Times.Once);
        _glpi.Verify(g => g.UpdateTicketStatusAsync(10, (int)TicketStatus.Solved, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusSolvedAndSolutionInsertFails_ThrowsUnprocessableEntityAndDoesNotUpdateStatus()
    {
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _accessPolicy.Setup(a => a.CanAddSolutionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Name = "Ticket 10", Status = 2 });
        _glpi.Setup(g => g.CreateSolutionAsync(10, "Solucion provista", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new GlpiApiException(500, "GLPI error"));

        var act = async () => await _svc.UpdateStatusAsync(10, (int)TicketStatus.Solved, 7, AppRole.Technician, "Solucion provista", CancellationToken.None);

        await act.Should().ThrowAsync<UnprocessableEntityException>()
            .WithMessage("*Error al registrar la solución*");
        _glpi.Verify(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenStatusNotSolved_DoesNotCheckSolution()
    {
        _accessPolicy.Setup(a => a.EvaluateStatusTransitionAsync(7, It.IsAny<AppRole>(), 5, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(StatusTransitionDecision.Allow());
        _glpi.Setup(g => g.UpdateTicketStatusAsync(5, 2, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var result = await _svc.UpdateStatusAsync(5, 2, 7, CancellationToken.None);

        result.Should().BeTrue();
        _repo.Verify(r => r.SolutionExistsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
        _glpi.Verify(g => g.UpdateTicketStatusAsync(5, 2, It.IsAny<CancellationToken>()), Times.Once);
        // Non-resolve transitions never auto-close.
        _glpi.Verify(g => g.UpdateTicketStatusAsync(5, (int)TicketStatus.Closed, It.IsAny<CancellationToken>()), Times.Never);
        _audit.Verify(a => a.LogAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ClaimAsync_WhenTicketNotFound_Throws404()
    {
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync((Ticket?)null);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task ClaimAsync_WhenStatusIsNotNew_Throws409()
    {
        var ticket = new Ticket { Id = 10, Status = (int)TicketStatus.Planned };
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(ticket);
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("El ticket debe estar en estado 'Nuevo' o 'Asignado' y sin técnico.");
    }

    [Fact]
    public async Task ClaimAsync_WhenAlreadyAssigned_Throws409()
    {
        var ticket = new Ticket { Id = 10, Status = (int)TicketStatus.New };
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(ticket);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { new TicketUser { TicketId = 10, UserId = 99, Type = (int)TicketUserType.Assigned } });
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("El ticket ya está asignado a un técnico.");
    }

    [Fact]
    public async Task ClaimAsync_WhenUserNotInGroup_ThrowsForbidden()
    {
        var ticket = new Ticket { Id = 10, Status = (int)TicketStatus.New };
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(ticket);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketUser>());
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenCallerCannotChangeStatus_ThrowsForbiddenBeforeStateValidation()
    {
        // A Waiting ticket resolved directly used to return 422 before authorization,
        // disclosing the ticket state to an out-of-scope caller.
        _accessPolicy.Setup(a => a.CanAttemptStatusChangeAsync(
                7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.Waiting });

        var act = async () => await _svc.UpdateStatusAsync(
            10, (int)TicketStatus.Solved, 7, AppRole.Technician, null, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
        _accessPolicy.Verify(a => a.EvaluateStatusTransitionAsync(
            It.IsAny<int>(), It.IsAny<AppRole>(), It.IsAny<int>(), It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
        _glpi.Verify(g => g.CreateSolutionAsync(It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<CancellationToken>()), Times.Never);
        _glpi.Verify(g => g.UpdateTicketStatusAsync(It.IsAny<int>(), It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ClaimAsync_WhenCallerCannotClaim_ThrowsForbiddenBeforeStateChecks()
    {
        // A ticket in a non-claimable state used to return 409 to an out-of-scope
        // caller before CanClaimAsync ran.
        var ticket = new Ticket { Id = 10, Status = (int)TicketStatus.Planned };
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(ticket);
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var act = async () => await _svc.ClaimAsync(10, 7, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>();
        _repo.Verify(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(),
            It.IsAny<CancellationToken>()), Times.Never);
        _repo.Verify(r => r.ClaimAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ClaimAsync_WhenAllValid_ReturnsUpdatedTicket()
    {
        var ticketBefore = new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.New };
        var ticketAfter = new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.Assigned };

        _repo.SetupSequence(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ticketBefore)
            .ReturnsAsync(ticketAfter);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketUser>());
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _repo.Setup(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _svc.ClaimAsync(10, 7, CancellationToken.None);

        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        result.Status.Should().Be((int)TicketStatus.Assigned);
        _repo.Verify(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>()), Times.Once);
        _audit.Verify(a => a.LogAsync(7, "claim", 10, null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ClaimAsync_WhenAuditFails_StillSucceeds()
    {
        var ticketBefore = new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.New };
        var ticketAfter = new Ticket { Id = 10, Name = "Ticket 10", Status = (int)TicketStatus.Assigned };

        _repo.SetupSequence(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ticketBefore)
            .ReturnsAsync(ticketAfter);
        _repo.Setup(r => r.GetUsersForTicketsAsync(It.IsAny<IReadOnlyCollection<int>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TicketUser>());
        _accessPolicy.Setup(a => a.CanClaimAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _repo.Setup(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _audit.Setup(a => a.LogAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("DB error"));

        var result = await _svc.ClaimAsync(10, 7, CancellationToken.None);

        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        result.Status.Should().Be((int)TicketStatus.Assigned);
        _repo.Verify(r => r.ClaimAsync(10, 7, 7, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task IsUserInTicketGroupAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.IsUserInTicketGroupAsync(10, 7, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _svc.IsUserInTicketGroupAsync(10, 7, CancellationToken.None);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task SolutionExistsAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.SolutionExistsAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var result = await _svc.SolutionExistsAsync(10, CancellationToken.None);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task SolutionInsertAsync_DelegatesToGlpiApiClient()
    {
        const string validSolution = "solucion valida para prueba";
        _repo.Setup(r => r.GetByIdAsync(10, It.IsAny<CancellationToken>())).ReturnsAsync(new Ticket { Id = 10 });
        _accessPolicy.Setup(a => a.CanAddSolutionAsync(7, It.IsAny<AppRole>(), 10, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _glpi.Setup(g => g.CreateSolutionAsync(10, validSolution, It.IsAny<CancellationToken>())).ReturnsAsync(99);

        var result = await _svc.SolutionInsertAsync(10, validSolution, 7, CancellationToken.None);

        result.Should().Be(99);
        _glpi.Verify(g => g.CreateSolutionAsync(10, validSolution, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetGroupIdsForUserAsync_DelegatesToRepository()
    {
        _repo.Setup(r => r.GetGroupIdsForUserAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { 1 });

        var result = await _svc.GetGroupIdsForUserAsync(7, CancellationToken.None);

        result.Should().Equal(1);
    }

    [Fact]
    public async Task GetUnassignedByGroupAsync_WhenGroupIdIsZero_ReturnsEmptyPageWithoutAuthorizationCheck()
    {
        var result = await _svc.GetUnassignedByGroupAsync(0, 7, AppRole.Technician, 20, 0, CancellationToken.None);

        result.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
        result.Limit.Should().Be(20);
        _accessPolicy.Verify(
            a => a.CanViewGroupQueueAsync(It.IsAny<int>(), It.IsAny<AppRole>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
        _repo.Verify(r => r.GetUnassignedByGroupAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetUnassignedByGroupAsync_WhenUserHasNoGroups_ReturnsEmptyPageInsteadOfForbidden()
    {
        _accessPolicy.Setup(a => a.CanViewGroupQueueAsync(7, It.IsAny<AppRole>(), 3, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.GetGroupIdsForUserAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(Array.Empty<int>());

        var result = await _svc.GetUnassignedByGroupAsync(3, 7, AppRole.Technician, 20, 0, CancellationToken.None);

        result.Items.Should().BeEmpty();
        result.Total.Should().Be(0);
    }

    [Fact]
    public async Task GetUnassignedByGroupAsync_WhenUserBelongsToAnotherGroup_StillThrowsForbidden()
    {
        _accessPolicy.Setup(a => a.CanViewGroupQueueAsync(7, It.IsAny<AppRole>(), 2, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        _repo.Setup(r => r.GetGroupIdsForUserAsync(7, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { 1 });

        var act = async () => await _svc.GetUnassignedByGroupAsync(2, 7, AppRole.Technician, 20, 0, CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenException>()
            .WithMessage("User 7 cannot view queue for group 2");
    }

    [Fact]
    public async Task CreateTicketAsync_WhenCategoryHasNoValidDestinationGroup_ThrowsValidationExceptionAndDoesNotFallbackToGroup1()
    {
        _repo.Setup(r => r.GetAssignmentGroupForCategoryAsync(999, 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync((int?)null);

        var act = async () => await _svc.CreateTicketAsync(
            "Incidencia sin grupo",
            "No debe caer en el grupo 1 por defecto",
            3,
            999,
            9,
            0,
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*no tiene un grupo de soporte válido configurado*");
        _glpi.Verify(g => g.CreateTicketAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(),
            It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateTicketAsync_WhenNoCategoryAndRequesterHasNoAuthorizedGroup_ThrowsValidationExceptionWithoutFallback()
    {
        _repo.Setup(r => r.GetAuthorizedGroupIdsForUserAsync(9, 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<int>());

        var act = async () => await _svc.CreateTicketAsync(
            "Incidencia sin categoría",
            "Solicitante externo sin grupo asignable",
            3,
            null,
            9,
            0,
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>()
            .WithMessage("*No existe un grupo de destino válido y autorizado*");
        _glpi.Verify(g => g.CreateTicketAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(),
            It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateTicketAsync_WhenCategoryBelongsToAnotherEntity_ThrowsValidationException()
    {
        // Category 50 is configured in Entity 5, but requester is in Entity 0
        _repo.Setup(r => r.GetAssignmentGroupForCategoryAsync(50, 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync((int?)null);

        var act = async () => await _svc.CreateTicketAsync(
            "Intento cross-entity",
            "Categoría de otra entidad",
            3,
            50,
            9,
            0,
            CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
        _glpi.Verify(g => g.CreateTicketAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(),
            It.IsAny<int?>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateTicketAsync_WhenMultiLevelCategoryResolvesAuthorizedGroup_AssignsExactGroupAndNotifiesDeduplicated()
    {
        // Child category 12 inherits group 2 from parent hierarchy within entity 0
        _repo.Setup(r => r.GetAssignmentGroupForCategoryAsync(12, 0, It.IsAny<CancellationToken>()))
            .ReturnsAsync(2);
        _glpi.Setup(g => g.CreateTicketAsync(
                "Incidencia subcategoría",
                "Detalle",
                4,
                12,
                9,
                2,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(501);
        _dashboard.Setup(d => d.GetTechnicianUserIdsInGroupAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { 8 });
        _inAppNotifications.Setup(n => n.CreateTicketCreatedOnceAsync(
                8, 501, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var ticketId = await _svc.CreateTicketAsync(
            "Incidencia subcategoría",
            "Detalle",
            4,
            12,
            9,
            0,
            CancellationToken.None);

        ticketId.Should().Be(501);
        _glpi.Verify(g => g.CreateTicketAsync("Incidencia subcategoría", "Detalle", 4, 12, 9, 2, It.IsAny<CancellationToken>()), Times.Once);
        _inAppNotifications.Verify(n => n.CreateTicketCreatedOnceAsync(8, 501, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        _notifications.Verify(n => n.NotifyTicketCreatedAsync(501, 2, It.IsAny<CancellationToken>()), Times.Once);
    }
}
