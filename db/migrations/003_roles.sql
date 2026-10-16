-- Mapeo GLPI profile → app role
CREATE TABLE IF NOT EXISTS role_profile_mapping (
    glpi_profile_id INT PRIMARY KEY,
    app_role TEXT NOT NULL CHECK (app_role IN ('technician', 'supervisor', 'admin')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mapeo inicial (IDs reales de GLPI: 6=Technician, 7=Supervisor, 3=Admin, 4=Super-Admin)
INSERT INTO role_profile_mapping (glpi_profile_id, app_role, notes) VALUES
    (6, 'technician', 'Perfil "Technician" en GLPI'),
    (7, 'supervisor', 'Perfil "Supervisor" en GLPI'),
    (3, 'admin', 'Perfil "Admin" en GLPI'),
    (4, 'admin', 'Perfil "Super-Admin" en GLPI')
ON CONFLICT (glpi_profile_id) DO NOTHING;

-- Overrides individuales (promover sin tocar GLPI)
CREATE TABLE IF NOT EXISTS user_role_overrides (
    user_id INT PRIMARY KEY,
    app_role TEXT NOT NULL CHECK (app_role IN ('technician', 'supervisor', 'admin')),
    granted_by INT NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT
);

-- Índice para queries de login
CREATE INDEX IF NOT EXISTS idx_user_role_overrides_user ON user_role_overrides (user_id);
