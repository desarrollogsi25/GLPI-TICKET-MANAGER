# Operación atómica de autoasignación (Claim) de tickets

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-04-DB-QUERY-CLAIM_ATOMICITY | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


- **Consumer:** `POST /api/tickets/{id}/claim`
- **Repository:** `TicketRepository.ClaimAsync`
- **Service:** `TicketService.ClaimAsync`
- **Queries:** `Infrastructure/Persistence/Queries/TicketQueries.cs` → `ClaimConditionalUpdate`, `InsertAssignee`
- **Access:** Transaccional de lectura y escritura (`UPDATE` + `INSERT` dentro de `DbTransaction`)

---

## Contexto y problema de concurrencia

En escenarios donde dos o más técnicos visualizan la cola de tickets sin asignar (`status = 1`) simultáneamente y pulsan "Asignarme" (`claim`) en la misma fracción de segundo, una implementación ingenua de lectura previa seguida de escritura sufre de una condición de carrera (*race condition* / *time-of-check to time-of-use*):

1. Técnico A lee el ticket: `status == 1`, sin técnico asignado.
2. Técnico B lee el ticket: `status == 1`, sin técnico asignado.
3. Técnico A inserta su asignación en `glpi_tickets_users` y actualiza el estado a `2`.
4. Técnico B inserta su asignación en `glpi_tickets_users` y actualiza el estado a `2`.
5. **Resultado anómalo:** El ticket termina asignado a dos técnicos a la vez o en un estado inconsistente.

Debido a que `glpi_tickets_users` posee una clave única `unicity (tickets_id, type, users_id, alternative_email)` que incluye `users_id`, la base de datos permite múltiples filas con `type = 2` para distintos `users_id` a menos que se controle estrictamente en la lógica de persistencia.

---

## Patrón de solución: UPDATE condicional + Transacción

Para resolver la condición de carrera sin necesidad de bloqueos pesados a nivel de tabla, se implementa una transacción con **UPDATE condicional**:

### 1. SQL utilizado

```sql
-- Paso 1: UPDATE condicional con verificación de estado y ausencia de asignado
UPDATE glpi_tickets 
SET status = 2, 
    date_mod = NOW(), 
    users_id_lastupdater = @UpdatedBy
WHERE id = @TicketId 
  AND status = 1
  AND NOT EXISTS (
    SELECT 1 FROM glpi_tickets_users 
    WHERE tickets_id = @TicketId AND type = 2
  );

-- Paso 2: INSERT del técnico asignado (solo si el paso 1 afectó 1 fila)
INSERT INTO glpi_tickets_users 
  (tickets_id, users_id, type, use_notification, alternative_email)
VALUES 
  (@TicketId, @UserId, 2, 1, NULL);
```

---

## ¿Por qué funciona en MariaDB (InnoDB)?

1. **Bloqueo a nivel de fila (Row-Level Locking):**  
   Al ejecutar un `UPDATE ... WHERE id = @TicketId`, el motor de almacenamiento InnoDB adquiere inmediatamente un bloqueo exclusivo de escritura (*X-lock*) sobre la fila del ticket con clave primaria `@TicketId`.
2. **Evaluación atómica de predicados:**  
   Si dos transacciones (T1 y T2) intentan actualizar el mismo `@TicketId` concurrentemente, T2 se suspende esperando que T1 libere el bloqueo de fila (al hacer `COMMIT` o `ROLLBACK`).
3. **Reevaluación del WHERE tras adquisición del bloqueo:**  
   Cuando T1 realiza el `UPDATE`, el estado pasa a `2`. Al hacer commit T1, T2 adquiere el bloqueo sobre la fila y reevalúa el predicado `WHERE status = 1 AND NOT EXISTS (...)`. Al no cumplirse la condición (`status` ya es `2` y ya existe un técnico en `glpi_tickets_users`), el `UPDATE` de T2 no modifica ningún registro (`rowsAffected = 0`).
4. **Rollback ante cero filas afectadas:**  
   Al detectar `rowsAffected == 0`, el repositorio ejecuta un `ROLLBACK` inmediato y retorna `false`, señalando que el ticket ya no estaba disponible.
5. **Rollback ante error en el INSERT:**  
   Si por cualquier fallo inesperado (ej. desconexión o violación de integridad) el `INSERT` falla, la transacción se aborta por completo en el bloque `catch` (`await tx.RollbackAsync(...)`), garantizando que `glpi_tickets` no quede con `status = 2` sin un asignado correspondiente.

---

## Mapeo HTTP

- **Éxito (1 fila afectada + asignación insertada):** Devuelve `200 OK` con los detalles actualizados del ticket.
- **Conflicto legítimo (`rowsAffected == 0`):** El servicio lanza `ConflictException("Ticket ya no está disponible.")`, mapeándose a `409 Conflict`.
- **Fallo de infraestructura / excepción de BD:** Se propaga como error de servidor `500 Internal Server Error`, sin enmascarar fallos de red o base de datos.
