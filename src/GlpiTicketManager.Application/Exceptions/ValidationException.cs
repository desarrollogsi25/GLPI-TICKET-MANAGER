namespace GlpiTicketManager.Application.Exceptions;

/// <summary>
/// Thrown when an incoming request fails business validation.
/// Mapped to HTTP 400 by the API layer.
/// </summary>
public sealed class ValidationException : Exception
{
    public ValidationException(IReadOnlyDictionary<string, string[]> errors)
        : base(errors.Values.SelectMany(v => v).FirstOrDefault() ?? "One or more validation errors occurred.")
    {
        Errors = errors;
    }

    public ValidationException(string propertyName, string errorMessage)
        : base(errorMessage)
    {
        Errors = new Dictionary<string, string[]> { [propertyName] = [errorMessage] };
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}
