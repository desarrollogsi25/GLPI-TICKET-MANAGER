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
