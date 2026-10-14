# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build stage: SDK image (fixed 9.0 tag, never "latest").
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore layer: copy only the solution, the SDK pin and the four csproj files
# so a source change never invalidates the NuGet restore cache (--link).
COPY --link global.json GlpiTicketManager.sln ./
COPY --link src/GlpiTicketManager.Domain/GlpiTicketManager.Domain.csproj src/GlpiTicketManager.Domain/
COPY --link src/GlpiTicketManager.Application/GlpiTicketManager.Application.csproj src/GlpiTicketManager.Application/
COPY --link src/GlpiTicketManager.Infrastructure/GlpiTicketManager.Infrastructure.csproj src/GlpiTicketManager.Infrastructure/
COPY --link src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj src/GlpiTicketManager.Api/
RUN dotnet restore src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj


# Build layer: copy the sources and publish a framework-dependent output.
COPY --link src/ src/
RUN dotnet publish src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj \
        -c Release \
        -o /app/publish \
        --no-restore \
        /p:UseAppHost=false

# ---------------------------------------------------------------------------
# Runtime stage: ASP.NET runtime image, unprivileged user.
# ---------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime

# Least privilege: the .NET 9 runtime image already ships an unprivileged
# `app` user/group (uid/gid 1654), so we reuse it instead of creating another.
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=build --chown=app:app /app/publish .

USER app

EXPOSE 8080
ENTRYPOINT ["dotnet", "GlpiTicketManager.Api.dll"]
