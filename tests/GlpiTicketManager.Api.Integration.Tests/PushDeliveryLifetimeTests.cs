using GlpiTicketManager.Api.Hubs;
using GlpiTicketManager.Api.Notifications;
using GlpiTicketManager.Application.Abstractions;
using GlpiTicketManager.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class PushDeliveryLifetimeTests
{
    private static NotificationService Service(Mock<IPushNotificationSender> sender,
        out Mock<INotificationRepository> repository)
    {
        repository = new Mock<INotificationRepository>();
        repository.Setup(r => r.CreateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(1L);
        var proxy = new Mock<IClientProxy>();
        proxy.Setup(p => p.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(),
            It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        var clients = new Mock<IHubClients>();
        clients.Setup(c => c.Group("user-19")).Returns(proxy.Object);
        var hub = new Mock<IHubContext<TicketHub>>();
        hub.SetupGet(h => h.Clients).Returns(clients.Object);
        return new NotificationService(repository.Object, hub.Object, sender.Object,
            NullLogger<NotificationService>.Instance);
    }

    [Fact]
    public async Task DeliveryIsAwaitedWithinScopeAndDoesNotExposeTicketTextToDevice()
    {
        var started = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var finished = new TaskCompletionSource<int>(TaskCreationOptions.RunContinuationsAsynchronously);
        var sender = new Mock<IPushNotificationSender>();
        sender.Setup(s => s.SendPushAsync(19, "Nuevo ticket #979",
                "Abre la aplicación para consultar los detalles.", "/tickets/979", It.IsAny<CancellationToken>()))
            .Callback(() => started.SetResult())
            .Returns(finished.Task);
        var service = Service(sender, out var repository);

        var operation = service.CreateAsync(19, "TicketCreated", 979,
            "PRIVATE-TITLE", "PRIVATE-DESCRIPTION");
        await started.Task.WaitAsync(TimeSpan.FromSeconds(3));
        Assert.False(operation.IsCompleted);
        finished.SetResult(1);
        var notification = await operation;

        Assert.Equal("PRIVATE-TITLE", notification.Title);
        Assert.Equal("PRIVATE-DESCRIPTION", notification.Message);
        repository.Verify(r => r.CreateAsync(It.Is<Notification>(n => n.Title == "PRIVATE-TITLE" &&
            n.Message == "PRIVATE-DESCRIPTION"), It.IsAny<CancellationToken>()), Times.Once);
        sender.Verify(s => s.SendPushAsync(19, "Nuevo ticket #979",
            "Abre la aplicación para consultar los detalles.", "/tickets/979", It.IsAny<CancellationToken>()), Times.Once);
        sender.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ProviderFailureKeepsThePersistedInternalNotification()
    {
        var sender = new Mock<IPushNotificationSender>();
        sender.Setup(s => s.SendPushAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Synthetic provider failure"));
        var service = Service(sender, out var repository);

        var notification = await service.CreateAsync(19, "Unknown-PRIVATE-TYPE", 979,
            "PRIVATE-TITLE", "PRIVATE-DESCRIPTION");

        Assert.Equal(1L, notification.Id);
        repository.Verify(r => r.CreateAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()), Times.Once);
        sender.Verify(s => s.SendPushAsync(19, "Actualización de ticket #979",
            "Abre la aplicación para consultar los detalles.", "/tickets/979", It.IsAny<CancellationToken>()), Times.Once);
    }
}
