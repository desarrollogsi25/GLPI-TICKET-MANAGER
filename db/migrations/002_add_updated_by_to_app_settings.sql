-- Migration 002: Add updated_by to app_settings (ADR-012 logical reference to glpi_users.id)

ALTER TABLE app_settings
    ADD COLUMN IF NOT EXISTS updated_by INT NULL;
