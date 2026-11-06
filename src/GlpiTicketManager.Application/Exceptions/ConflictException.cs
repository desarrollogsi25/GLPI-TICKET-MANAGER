namespace GlpiTicketManager.Application.Exceptions;

/// <summary>Thrown when a business-rule conflict prevents the operation.</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : this(message, null, null) { }

    /// <param name="code">
    /// Machine-readable reason consumed by the client to pick the right message:
    /// schedule_conflict, state_conflict, task_modified, task_not_editable,
    /// no_changes, idempotency_conflict or glpi_unconfirmed.
    /// </param>
    /// <param name="details">Structured context (conflicting intervals, suggestions).</param>
    public ConflictException(string message, string? code,
        IReadOnlyDictionary<string, object?>? details = null) : base(message)
    {
        Code = code;
        Details = details;
    }

    public string? Code { get; }
    public IReadOnlyDictionary<string, object?>? Details { get; }
}