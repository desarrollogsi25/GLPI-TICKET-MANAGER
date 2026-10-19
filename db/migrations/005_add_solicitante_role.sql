-- Soporte para rol 'solicitante' (Perfil 1 Self-Service de GLPI)
ALTER TABLE role_profile_mapping DROP CONSTRAINT IF EXISTS role_profile_mapping_app_role_check;
ALTER TABLE role_profile_mapping ADD CONSTRAINT role_profile_mapping_app_role_check 
    CHECK (app_role IN ('solicitante', 'technician', 'supervisor', 'admin'));

ALTER TABLE user_role_overrides DROP CONSTRAINT IF EXISTS user_role_overrides_app_role_check;
ALTER TABLE user_role_overrides ADD CONSTRAINT user_role_overrides_app_role_check 
    CHECK (app_role IN ('solicitante', 'technician', 'supervisor', 'admin'));

INSERT INTO role_profile_mapping (glpi_profile_id, app_role, notes)
VALUES (1, 'solicitante', 'Perfil Self-Service en GLPI')
ON CONFLICT (glpi_profile_id) DO UPDATE SET app_role = 'solicitante';
