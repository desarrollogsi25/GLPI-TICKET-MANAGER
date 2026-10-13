namespace GlpiTicketManager.Application.Exceptions;

/// <summary>
/// Thrown when an incoming request fails business validation.
/// Mapped to HTTP 400 by the API layer.
/// </summary>
public sealed class ValidationException : Exception
{
    public ValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base("One or more validation errors occurred.")
    {
        Errors = errors;
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}
