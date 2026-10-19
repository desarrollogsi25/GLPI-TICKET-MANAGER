# ADR-016 — Almacenamiento del JWT en el frontend

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-016 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


## Estado
Accepted

## Contexto
El frontend guarda el JWT en localStorage (a través de Zustand persist). 
localStorage es accesible desde JavaScript. Un XSS permitiría extraer el 
token.

## Decisión
Mantener localStorage en el MVP. Razones:
- No hay contenido HTML no confiable renderizado
- El JWT tiene expiración corta (1h)
- Migrar a cookies HttpOnly requiere:
  * Cambios en CORS y CSRF
  * Cambios en el flujo de login
  * Un BFF (Backend For Frontend) o middleware adicional
- El coste de la migración no justifica el beneficio en el modelo de amenaza 
  actual (red interna, usuarios conocidos)

## Mitigaciones implementadas
- JWT con expiración de 1h
- Revocación en servidor (revoked_tokens)
- Sin HTML no confiable (no dangerouslySetInnerHTML en ningún componente)
- CSP estricta (a configurar cuando se despliegue con Nginx)

## Revisión
Revisar esta decisión si:
- Se renderiza contenido de usuario
- Se expone el sistema a internet
- Se detecta un XSS

## Referencias
- OWASP JWT Cheat Sheet
- Bloque 4e del plan de remediación
