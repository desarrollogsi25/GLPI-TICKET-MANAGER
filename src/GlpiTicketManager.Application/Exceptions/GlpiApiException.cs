namespace GlpiTicketManager.Application.Exceptions;

/// <summary>
/// Raised when the GLPI REST API answers with an error status.
/// </summary>
public sealed class GlpiApiException : Exception
{
    public GlpiApiException(int statusCode, string message, string? responseBody = null)
        : base(message)
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
    }

    public int StatusCode { get; }

    public string? ResponseBody { get; }
}
