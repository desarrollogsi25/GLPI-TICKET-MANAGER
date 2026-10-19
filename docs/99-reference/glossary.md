# Glosario Técnico y de Negocio

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-99-REF-GLOSSARY | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Términos de Negocio y Mesa de Ayuda

- **Ticket / Incidencia:** Unidad básica de trabajo en GLPI que representa una solicitud de soporte, incidente o cambio.
- **Técnico Asignado:** Usuario técnico responsable de diagnosticar y solucionar el ticket.
- **Supervisor:** Rol responsable del monitoreo de colas grupales, reasignación y reapertura de tickets en sus grupos correspondientes.
- **Solicitante (Requester):** Persona o entidad que originó el requerimiento (puede ser usuario registrado en GLPI o contacto externo).
- **Seguimiento (Followup):** Comentario o actualización en el historial del ticket. Puede tener visibilidad pública o privada.
- **Solución (Solution):** Descripción formal de la resolución aplicada a un ticket para darlo por resuelto.

## 2. Términos Técnicos y de Arquitectura

- **GLPI:** *Gestionnaire Libre de Parc Informatique*, sistema de gestión de activos de TI y mesa de ayuda de código abierto.
- **SignalR:** Biblioteca de ASP.NET Core que habilita comunicación bidireccional en tiempo real entre cliente y servidor.
- **JWT (JSON Web Token):** Estándar abierto (RFC 7519) utilizado para autenticación stateless entre el cliente frontend y el backend API.
- **Dapper:** Micro-ORM de alto rendimiento utilizado para consultas optimizadas de lectura sobre la base de datos de GLPI.
- **PostgreSQL (`app-db`):** Base de datos relacional complementaria utilizada para metadatos del sistema (revocación de tokens, auditoría, configuración de roles).
- **Control de Concurrencia Optimista:** Estrategia que previene que dos usuarios sobrescriban simultáneamente un registro sin validación previa de versión o estado (HTTP 409 Conflict).
