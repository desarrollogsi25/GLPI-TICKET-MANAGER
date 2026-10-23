#!/usr/bin/env bash
# =============================================================================
# H-39 · Aplica la provisión de usuarios de prueba de GLPI y verifica el login.
# Uso: bash scripts/provision-glpi-test-users.sh
# Requiere los contenedores glpi-db y glpi levantados (docker compose up -d).
# =============================================================================
set -euo pipefail

if [ -z "${MARIADB_PASSWORD:-}" ] && [ -f .env ]; then
  MARIADB_PASSWORD=$(grep '^MARIADB_PASSWORD=' .env | cut -d '=' -f2-)
fi
MARIADB_USER="${MARIADB_USER:-glpi}"

mariadb_exec() {
  docker compose exec -T glpi-db mariadb -u"${MARIADB_USER}" -p"${MARIADB_PASSWORD}" glpi "$@"
}

echo "Aplicando scripts/provision-glpi-test-users.sql..."
mariadb_exec < scripts/provision-glpi-test-users.sql

echo
echo "Verificando hash y estado de autenticación de cada cuenta..."
docker compose exec -T -e GLPI_TEST_PASSWORD='Password123!' -e MARIADB_PASSWORD="${MARIADB_PASSWORD}" glpi php -r '
$users = [
    "admin_test", "lider_dev", "lider_bi", "lider_sd",
    "tech_dev", "tech_bi", "tech_sd", "user_test",
];
$host = getenv("GLPI_DB_HOST") ?: "glpi-db";
$db = mysqli_init();
$db->real_connect($host, "glpi", getenv("MARIADB_PASSWORD") ?: "", "glpi");
$ok = true;
$stmt = $db->prepare("SELECT name, password, authtype, auths_id, is_active, is_deleted FROM glpi_users WHERE name = ?");
foreach ($users as $name) {
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if (!$row) {
        printf("  FAIL %-10s no existe\n", $name);
        $ok = false;
        continue;
    }
    $valid = password_verify(getenv("GLPI_TEST_PASSWORD"), $row["password"]);
    $authOk = (int)$row["authtype"] === 1 && (int)$row["auths_id"] === 0;
    $active = (int)$row["is_active"] === 1 && (int)$row["is_deleted"] === 0;
    printf(
        "  %s %-10s password=%s authtype=%d auths_id=%d active=%d\n",
        ($valid && $authOk && $active) ? "OK  " : "FAIL",
        $name,
        $valid ? "valid" : "INVALID",
        $row["authtype"],
        $row["auths_id"],
        $row["is_active"]
    );
    $ok = $ok && $valid && $authOk && $active;
}
exit($ok ? 0 : 1);
'
