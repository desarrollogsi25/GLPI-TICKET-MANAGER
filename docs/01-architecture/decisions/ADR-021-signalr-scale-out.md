# ADR-021 — Escalado horizontal de SignalR (backplane de Redis)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-021 | **Versión:** 1.0.0 | **Fecha:** 2026-10-22 | **Autor:** GLPI Ticket Manager Team

## Estado
Accepted (decisión de no-implementación por ahora)

## Contexto

El módulo de tiempo real usa ASP.NET Core SignalR sobre WebSockets (ADR-018). La
implementación actual asume **una sola instancia** del backend: las conexiones de los
clientes se mantienen en memoria del proceso y los eventos se emiten con
`IHubContext<TicketHub>` sobre ese mismo proceso.

Si en el futuro el backend se despliega con **más de una instancia** (balanceo de
carga, alta disponibilidad), las conexiones de SignalR se repartirán entre procesos.
En ese escenario, un evento emitido por la instancia A **no llegará** a los clientes
conectados a la instancia B, porque no comparten el estado de las conexiones. El
tablero quedaría "conectado" pero mudo para los eventos generados en otra instancia.

## Decisión

**No se implementa un backplane de Redis en esta versión.** El despliegue actual es
de una sola instancia y no se prevé escalar horizontalmente a corto plazo. Añadir
Redis introduciría una dependencia operativa (servicio adicional, configuración,
monitorización, failover) sin un beneficio medible mientras haya una sola instancia.

**Condición de activación:** si el número de instancias del backend supera 1, **se
debe añadir un backplane de Redis para SignalR** antes de poner la segunda instancia
en producción. Esta decisión es bloqueante para el escalado horizontal: no se puede
escalar sin el backplane.

## Consecuencias

- **Positivas:** simplicidad operativa, sin dependencia adicional, menor superficie
  de fallo, coste de infraestructura reducido.
- **Negativas / riesgos:** el sistema no escala horizontalmente hoy. Si se intenta
  escalar sin el backplane, los eventos en tiempo real se perderán silenciosamente
  para los clientes conectados a otras instancias.
- **Mitigación:** este ADR documenta la condición de activación y el requisito
  bloqueante, de modo que cualquier plan de escalado la tenga en cuenta. La
  implementación del backplane es trivial en .NET (`AddStackExchangeRedis` en
  `Program.cs`) cuando llegue el momento.

## Implementación futura (cuando aplique)

```csharp
// Program.cs, al configurar SignalR
builder.Services.AddSignalR()
    .AddStackExchangeRedis(builder.Configuration["Redis:ConnectionString"]);
```

Requiere: servicio Redis accesible por todas las instancias, cadena de conexión en
configuración, y verificación de que las invalidaciones de TanStack Query siguen
funcionando entre instancias (no cambian: el backplane sólo propaga los mensajes).

## Alternativas consideradas

- **Redis backplane ahora:** descartado por coste operativo sin beneficio inmediato
  (una sola instancia).
- **Azure SignalR Service:** descartado por dependencia de nube y coste; se
  reconsiderará si el despliegue migra a Azure.
- **Sticky sessions en el balanceador:** no resuelve el problema (los eventos se
  emiten desde una instancia arbitraria según dónde se procese la escritura).

## Referencias

- [ADR-018 — Notificaciones en tiempo real mediante SignalR](ADR-018-signalr-realtime.md)
- [Módulo de tiempo real](../../02-modules/realtime/overview.md)
- [BUG-032 — Inestabilidad 429 en el Kanban](../../11-incidents/BUG-032.md)
