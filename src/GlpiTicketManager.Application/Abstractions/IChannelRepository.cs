using GlpiTicketManager.Application.Dtos.Channels;

namespace GlpiTicketManager.Application.Abstractions;

public interface IChannelRepository
{
    Task<IReadOnlyList<ChannelDto>> GetAllActiveAsync(CancellationToken ct = default);
}
