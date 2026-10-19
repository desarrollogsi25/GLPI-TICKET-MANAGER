namespace GlpiTicketManager.Domain.Enums;

public enum AppRole
{
    Solicitante = 0,
    Technician = 1,
    Supervisor = 2,
    Admin = 3
}

public static class AppRoleExtensions
{
    public static string ToClaimValue(this AppRole role) => role switch
    {
        AppRole.Solicitante => "solicitante",
        AppRole.Technician => "technician",
        AppRole.Supervisor => "supervisor",
        AppRole.Admin => "admin",
        _ => "technician"
    };

    public static AppRole? FromClaimValue(string? value) => value?.ToLowerInvariant() switch
    {
        "solicitante" or "requester" => AppRole.Solicitante,
        "technician" => AppRole.Technician,
        "supervisor" => AppRole.Supervisor,
        "admin" => AppRole.Admin,
        _ => null
    };
}
