using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;

namespace GlpiTicketManager.Api.OpenApi;

/// <summary>
/// Adds metadata and the JWT bearer security scheme to the generated OpenAPI document
/// so it renders correctly in Scalar.
/// </summary>
public static class OpenApiConfiguration
{
    public static void Configure(OpenApiOptions options)
    {
        options.AddDocumentTransformer((document, _, _) =>
        {
            document.Info.Title = "GLPI Ticket Manager API";
            document.Info.Version = "v1";
            document.Info.Description =
                "Ticket management for GLPI 11. Reads go straight to MariaDB (Dapper); " +
                "writes go through the GLPI REST API. Authentication uses the API's own JWT.";

            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "JWT returned by POST /api/auth/login."
            };

            document.SecurityRequirements.Add(new OpenApiSecurityRequirement
            {
                [
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    }
                ] = Array.Empty<string>()
            });

            return Task.CompletedTask;
        });
    }
}
