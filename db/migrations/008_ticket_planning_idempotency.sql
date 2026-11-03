-- Durable operation reservation shared across API instances for native GLPI TicketTask creation.
CREATE TABLE IF NOT EXISTS ticket_planning_idempotency (
    idempotency_key TEXT PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    payload_sha256 CHAR(64) NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('pending', 'completed')),
    glpi_task_id INTEGER NULL,
    lease_expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_ticket_planning_idempotency_completion
        CHECK ((state = 'pending' AND glpi_task_id IS NULL) OR (state = 'completed' AND glpi_task_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS ix_ticket_planning_idempotency_pending_lease
    ON ticket_planning_idempotency (lease_expires_at)
    WHERE state = 'pending';
