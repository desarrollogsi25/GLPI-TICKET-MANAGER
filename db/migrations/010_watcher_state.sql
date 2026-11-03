-- Migration 010: Durable checkpoint and pending tickets registry for GLPI Native Watcher
-- Solves: volatile memory cursor on restart, late group assignments, and multi-node concurrency.

CREATE TABLE IF NOT EXISTS glpi_watcher_checkpoint (
    id INT PRIMARY KEY DEFAULT 1,
    last_seen_ticket_id INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO glpi_watcher_checkpoint (id, last_seen_ticket_id)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS glpi_watcher_pending_tickets (
    ticket_id INT PRIMARY KEY,
    category_id INT NOT NULL DEFAULT 0,
    ticket_name VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'AwaitingGroup',
    attempts INT NOT NULL DEFAULT 0,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_retry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_glpi_watcher_pending_next_retry
ON glpi_watcher_pending_tickets (next_retry_at)
WHERE status IN ('AwaitingGroup', 'Retry', 'AwaitingTechnician');
