# CORS en despliegues separados (H-06)

La API solo responde a solicitudes CORS con credenciales provenientes de
orígenes explícitamente autorizados en `Cors:AllowedOrigins`.

- En desarrollo se permiten `http://localhost:5173` y
  `http://127.0.0.1:5173`.
- En producción no hay orígenes permitidos por defecto. Si el frontend y la API
  usan un proxy inverso bajo el mismo origen, no necesitan CORS.
- Si frontend y API se despliegan en orígenes distintos, configurar
  `CORS_ALLOWED_ORIGIN` en el `.env` de Compose con el origen HTTPS exacto,
  incluyendo puerto solo cuando corresponda.
- Sin Compose, configurar `Cors__AllowedOrigins__0` en el entorno de la API.
  Para varios frontends, usar `Cors__AllowedOrigins__1`, `__2`, etc.
- No se aceptan comodines (`*`), rutas, parámetros, fragmentos o credenciales
  incrustadas en el origen. Las peticiones del mismo origen no requieren CORS.

Después de desplegar, comprobar el preflight `OPTIONS` desde el frontend real,
un origen no autorizado y la ausencia de cabeceras CORS en este último.
Conservar los orígenes permitidos separados por entorno y revisar los cambios
de dominios/puertos en cada despliegue.
