# Integración con GLPI REST API

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-05-INT-GLPI-REST | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Propósito

Detalla los mecanismos de integración con la API REST nativa de GLPI (`/apirest.php`), el ciclo de vida de sesiones y la estrategia híbrida de escrituras.

## 2. Ciclo de Vida de Sesión Stateless

Cada mutación contra la API REST de GLPI se realiza a través de `GlpiApiClient` siguiendo un patrón efímero y seguro:

1. `initSession`: Envía `App-Token` y cabecera `Authorization: user_token <token>` para obtener un `session_token` temporal.
2. Ejecución de la operación (`Ticket`, `ITILSolution`, `Ticket/{id}`).
3. `killSession`: Invocado obligatoriamente en un bloque `finally` para cerrar la sesión y liberar recursos de GLPI.
4. El `session_token` nunca se expone a clientes externos ni se almacena en base de datos.

## 3. Estrategia Híbrida de Mutaciones (ADR-017)

- **Vía REST API**:
  - Cambios de estado de tickets (`PUT /Ticket/{id}`).
  - Registro de soluciones (`POST /ITILSolution`).
  - Reapertura de tickets (`PUT /Ticket/{id}`).
  - Creación de seguimientos privados (`POST /ITILFollowup`).
- **Vía SQL Atómico Transaccional**:
  - Reclamo de ticket (`claim`): Ejecutado directamente contra MariaDB con un `UPDATE` condicional bajo aislamiento transaccional para garantizar concurrencia sin carreras.

## 4. Seguridad y Credenciales

- Los tokens de aplicación (`GlpiApi:AppToken`) y usuario (`GlpiApi:UserToken`) se configuran mediante variables de entorno en el host o contenedor.
- Ninguna credencial de GLPI es accesible desde el navegador ni viaja en llamadas al cliente React.
