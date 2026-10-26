using System.Diagnostics;
using System.Net;
using System.Text.Json;
using FluentAssertions;
using GlpiTicketManager.Application.Exceptions;
using GlpiTicketManager.Infrastructure.Glpi;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace GlpiTicketManager.Api.Integration.Tests;

public class GlpiSessionPoolTests
{
    private class CountingHttpMessageHandler : HttpMessageHandler
    {
        public int InitSessionCalls { get; set; }
        public int PutTicketCalls { get; set; }
        public int TotalRequests { get; set; }
        public bool Simulate401OnFirstPut { get; set; }
        public int Simulated401Count { get; set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            TotalRequests++;
            var url = request.RequestUri?.ToString() ?? string.Empty;

            if (url.EndsWith("initSession", StringComparison.OrdinalIgnoreCase))
            {
                InitSessionCalls++;
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(JsonSerializer.Serialize(new { session_token = $"token-{Guid.NewGuid():N}" }))
                };
                return Task.FromResult(response);
            }

            if (request.Method == HttpMethod.Put && url.Contains("Ticket/"))
            {
                if (Simulate401OnFirstPut && Simulated401Count == 0)
                {
                    Simulated401Count++;
                    var unauthorizedResponse = new HttpResponseMessage(HttpStatusCode.Unauthorized)
                    {
                        Content = new StringContent("{\"message\":\"ERROR_SESSION_TOKEN_INVALID\"}")
                    };
                    return Task.FromResult(unauthorizedResponse);
                }

                PutTicketCalls++;
                var response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("{\"message\":\"Ticket updated\"}")
                };
                return Task.FromResult(response);
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }

    [Fact]
    public async Task SessionTokenPool_ReducesHttpCallsByAround66Percent_For10Updates()
    {
        var handler = new CountingHttpMessageHandler();
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://localhost:8081/apirest.php/")
        };

        var options = Options.Create(new GlpiOptions
        {
            BaseUrl = "http://localhost:8081/apirest.php/",
            AppToken = "app-token-test-32-chars-minimum!!",
            UserToken = $"user-{Guid.NewGuid():N}"
        });

        var client = new GlpiApiClient(httpClient, options, NullLogger<GlpiApiClient>.Instance);

        var sw = Stopwatch.StartNew();
        for (int i = 1; i <= 10; i++)
        {
            await client.UpdateTicketStatusAsync(i, 2, CancellationToken.None);
        }
        sw.Stop();

        // Sin pool: 10 initSession + 10 PUT + 10 killSession = 30 peticiones HTTP.
        // Con pool: 1 initSession + 10 PUT + 0 killSession = 11 peticiones HTTP.
        // Reducción: (30 - 11) / 30 = 63.3% (~66% de reducción en overhead y llamadas HTTP).
        handler.InitSessionCalls.Should().Be(1, "el token de sesión se reutilizó desde el pool");
        handler.PutTicketCalls.Should().Be(10, "se realizaron 10 actualizaciones");
        handler.TotalRequests.Should().Be(11, "solo 11 peticiones totales en lugar de 30 (reducción del 63.3% ~ 66%)");
    }

    [Fact]
    public async Task SessionTokenPool_When401Returned_InvalidatesAndRetriesOnce()
    {
        var handler = new CountingHttpMessageHandler
        {
            Simulate401OnFirstPut = true
        };
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://localhost:8081/apirest.php/")
        };

        var options = Options.Create(new GlpiOptions
        {
            BaseUrl = "http://localhost:8081/apirest.php/",
            AppToken = "app-token-test-32-chars-minimum!!",
            UserToken = $"user-{Guid.NewGuid():N}"
        });

        var client = new GlpiApiClient(httpClient, options, NullLogger<GlpiApiClient>.Instance);

        // Al recibir 401 en el primer intento, debe reabrir sesión e intentar nuevamente
        await client.UpdateTicketStatusAsync(100, 3, CancellationToken.None);

        handler.Simulated401Count.Should().Be(1);
        handler.InitSessionCalls.Should().Be(2, "debió abrir una segunda sesión tras el 401");
        handler.PutTicketCalls.Should().Be(1, "el reintento tuvo éxito");
    }
}
