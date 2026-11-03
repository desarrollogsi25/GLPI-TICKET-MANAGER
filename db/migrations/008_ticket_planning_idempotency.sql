-- TicketTask writes are not idempotent in GLPI; coordinate all API instances here.
-- A row with no task_id is intentionally NOT retried automatically: GLPI could
-- have created the task before a timeout or a failed response.
CREATE TABLE IF NOT EXISTS ticket_planning_requests (
    request_id UUID PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    payload_hash CHAR(64) NOT NULL,
    task_id INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT ck_ticket_planning_task_positive CHECK (task_id IS NULL OR task_id > 0)
);

CREATE INDEX IF NOT EXISTS idx_ticket_planning_requests_ticket
    ON ticket_planning_requests (ticket_id, created_at DESC);

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
