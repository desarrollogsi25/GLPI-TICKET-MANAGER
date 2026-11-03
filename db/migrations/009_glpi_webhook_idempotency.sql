-- Cross-instance webhook event reservation and durable notification deduplication.
CREATE TABLE IF NOT EXISTS glpi_webhook_events (
    event_key TEXT PRIMARY KEY,
    payload_sha256 CHAR(64) NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('pending', 'completed')),
    lease_expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_glpi_webhook_events_lease
        CHECK ((state = 'pending' AND lease_expires_at IS NOT NULL) OR (state = 'completed' AND lease_expires_at IS NULL))
);

CREATE INDEX IF NOT EXISTS ix_glpi_webhook_events_pending_lease
    ON glpi_webhook_events (lease_expires_at)
    WHERE state = 'pending';

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS idempotency_key TEXT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_idempotency_key
    ON notifications (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
