# syntax=docker/dockerfile:1

ARG SDK_IMAGE=mcr.microsoft.com/dotnet/sdk:10.0
ARG RUNTIME_IMAGE=mcr.microsoft.com/dotnet/aspnet:10.0-alpine

# ---------------------------------------------------------------------------
# Stage 1: build
# ---------------------------------------------------------------------------
FROM ${SDK_IMAGE} AS build
WORKDIR /src

# Restore dependencies
COPY --link global.json GlpiTicketManager.sln ./
COPY --link src/GlpiTicketManager.Domain/GlpiTicketManager.Domain.csproj src/GlpiTicketManager.Domain/
COPY --link src/GlpiTicketManager.Application/GlpiTicketManager.Application.csproj src/GlpiTicketManager.Application/
COPY --link src/GlpiTicketManager.Infrastructure/GlpiTicketManager.Infrastructure.csproj src/GlpiTicketManager.Infrastructure/
COPY --link src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj src/GlpiTicketManager.Api/
RUN dotnet restore src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj

# Build source
COPY --link src/ src/
RUN dotnet build src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj \
    -c Release \
    --no-restore

# ---------------------------------------------------------------------------
# Stage 2: publish
# ---------------------------------------------------------------------------
FROM build AS publish
RUN dotnet publish src/GlpiTicketManager.Api/GlpiTicketManager.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-build \
    /p:UseAppHost=false

# ---------------------------------------------------------------------------
# Stage 3: final (unprivileged non-root user on alpine)
# ---------------------------------------------------------------------------
FROM ${RUNTIME_IMAGE} AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true

COPY --from=publish --chown=app:app /app/publish .

USER app

EXPOSE 8080
ENTRYPOINT ["dotnet", "GlpiTicketManager.Api.dll"]
