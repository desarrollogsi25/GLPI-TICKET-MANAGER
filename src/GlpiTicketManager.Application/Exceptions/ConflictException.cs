namespace GlpiTicketManager.Application.Exceptions;

/// <summary>Thrown when a business-rule conflict prevents the operation.</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}