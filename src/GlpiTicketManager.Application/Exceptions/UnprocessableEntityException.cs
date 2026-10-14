namespace GlpiTicketManager.Application.Exceptions;

/// <summary>Thrown when a request cannot be processed despite valid syntax.</summary>
public class UnprocessableEntityException : Exception
{
    public UnprocessableEntityException(string message) : base(message) { }
}