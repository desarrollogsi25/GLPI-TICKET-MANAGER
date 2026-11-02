-- H-02/H-14: cross-replica, durable deduplication for GLPI TicketCreated webhooks.
-- A reservation and notification are inserted by ONE PostgreSQL statement;
-- failure rolls back both, so GLPI can safely retry an incomplete delivery.
CREATE TABLE IF NOT EXISTS glpi_ticket_created_notification_keys (
    user_id INT NOT NULL,
    ticket_id INT NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, ticket_id)
);

-- Preserve every historical notification (including duplicates), but seed
-- claims from them so this deployment does not notify those recipients again.
INSERT INTO glpi_ticket_created_notification_keys (user_id, ticket_id)
SELECT DISTINCT user_id, ticket_id
FROM notifications
WHERE type = 'TicketCreated' AND ticket_id IS NOT NULL
ON CONFLICT DO NOTHING;
