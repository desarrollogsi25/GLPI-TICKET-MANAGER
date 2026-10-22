-- Migration 007: GLPI 11 Webhook configuration for ticket creation events (H-35)
-- This script configures a webhook in GLPI's native webhook system to call our backend
-- when a new ticket is created. Idempotent: safe to run multiple times.

-- Configuration values (should match docker-compose environment)
-- Webhook URL: http://glpi-api:8080/api/integrations/glpi/ticket-created
-- Secret: glpi-webhook-secret-token-32-chars-minimum!!

USE glpi;

-- 1. Ensure the webhook category exists
INSERT IGNORE INTO `glpi_webhookcategories` (`id`, `name`, `comment`, `completename`, `level`, `ancestors_cache`, `sons_cache`, `date_creation`, `date_mod`)
VALUES (1, 'Ticket Manager', 'Webhooks for GLPI Ticket Manager integration', 'Ticket Manager', 0, '[]', '[]', NOW(), NOW());

-- 2. Insert or update the webhook for ticket creation
-- Using INSERT ... ON DUPLICATE KEY UPDATE for idempotency
-- We identify by name + itemtype + event combination
INSERT INTO `glpi_webhooks` (
    `entities_id`,
    `is_recursive`,
    `name`,
    `comment`,
    `webhookcategories_id`,
    `itemtype`,
    `event`,
    `payload`,
    `use_default_payload`,
    `custom_headers`,
    `url`,
    `secret`,
    `use_cra_challenge`,
    `http_method`,
    `sent_try`,
    `expiration`,
    `is_active`,
    `save_response_body`,
    `log_in_item_history`,
    `date_creation`,
    `date_mod`
) VALUES (
    0,                          -- entities_id (0 = all entities)
    1,                          -- is_recursive
    'Ticket Manager - Nuevo Ticket Creado',  -- name
    'Webhook que notifica al backend cuando se crea un nuevo ticket en GLPI',  -- comment
    1,                          -- webhookcategories_id (Ticket Manager category)
    'Ticket',                   -- itemtype
    'new',                      -- event (new item creation)
    '{"ticketId": "##ticket.id##"}',  -- payload with GLPI placeholder
    0,                          -- use_default_payload (0 = use custom payload)
    'X-Webhook-Secret: glpi-webhook-secret-token-32-chars-minimum!!\nContent-Type: application/json',  -- custom_headers
    'http://glpi-api:8080/api/integrations/glpi/ticket-created',  -- url (internal Docker network)
    'glpi-webhook-secret-token-32-chars-minimum!!',  -- secret
    0,                          -- use_cra_challenge
    'POST',                     -- http_method
    3,                          -- sent_try (retry attempts)
    0,                          -- expiration (0 = no expiration)
    1,                          -- is_active
    0,                          -- save_response_body
    0,                          -- log_in_item_history
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    `comment` = VALUES(`comment`),
    `webhookcategories_id` = VALUES(`webhookcategories_id`),
    `itemtype` = VALUES(`itemtype`),
    `event` = VALUES(`event`),
    `payload` = VALUES(`payload`),
    `use_default_payload` = VALUES(`use_default_payload`),
    `custom_headers` = VALUES(`custom_headers`),
    `url` = VALUES(`url`),
    `secret` = VALUES(`secret`),
    `http_method` = VALUES(`http_method`),
    `sent_try` = VALUES(`sent_try`),
    `expiration` = VALUES(`expiration`),
    `is_active` = VALUES(`is_active`),
    `save_response_body` = VALUES(`save_response_body`),
    `log_in_item_history` = VALUES(`log_in_item_history`),
    `date_mod` = NOW();

-- 3. Verify the webhook was created/updated
SELECT 
    `id`, `name`, `itemtype`, `event`, `url`, `http_method`, `is_active`,
    `custom_headers`, `payload`
FROM `glpi_webhooks` 
WHERE `name` = 'Ticket Manager - Nuevo Ticket Creado';

-- 4. Also verify the category exists
SELECT `id`, `name`, `comment` FROM `glpi_webhookcategories` WHERE `id` = 1;