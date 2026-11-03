#!/usr/bin/env bash
# Run inside disposable MariaDB with an administrative client account and a trusted
# single-database GLPI 11 dump (without USE/CREATE DATABASE).
set -euo pipefail
migration=${1:?provide migration SQL}
schema_dump=${2:?provide a disposable GLPI 11 dump}
db="test007_$(date +%s)_$$"
url='http://receiver.invalid/api/integrations/glpi/ticket-created'
mariadb -e "CREATE DATABASE \`$db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
sql() { mariadb --batch --skip-column-names "$db" "$@"; }
sql < "$schema_dump"
digest() {
    mariadb-dump --skip-comments --order-by-primary --hex-blob "$@" "$db" | sha256sum
}
run() {
    { printf "SET @glpi_expected_database='%s', @glpi_webhook_url='%s';\n" "$1" "$url"; cat "$migration"; } | sql
}
reject() {
    local previous result
    previous=$(digest)
    if result=$(run "$1" 2>&1); then echo "Expected rejection: $2" >&2; exit 1; fi
    [[ "$result" == *"$2"* && "$(digest)" == "$previous" ]]
}
[[ $(sql -e "SELECT COUNT(*) FROM glpi_webhooks") == 0 ]]
reject wrong_schema 'Wrong or unspecified target database'
sql -e "INSERT INTO glpi_webhookcategories(name,comment) VALUES ('Ticket Manager','foreign')"
reject "$db" 'Category ownership conflict'
sql -e "DELETE FROM glpi_webhookcategories WHERE comment='foreign';
        INSERT INTO glpi_webhooks(name) VALUES ('Ticket Manager - Nuevo Ticket Creado')"
# InnoDB does not roll back AUTO_INCREMENT allocation. Compare rows for failures
# after an attempted insert, separately from the allocator's high-water mark.
rows() { mariadb-dump --no-create-info --skip-comments --order-by-primary "$db" | sha256sum; }
reject_after_insert() {
    local before result
    before=$(rows)
    if result=$(run "$db" 2>&1); then exit 1; fi
    [[ "$result" == *"$1"* && "$(rows)" == "$before" ]]
}
reject_after_insert 'Webhook ownership or configuration conflict'
sql -e "DELETE FROM glpi_webhooks WHERE name='Ticket Manager - Nuevo Ticket Creado';
        CREATE TRIGGER test007_failure BEFORE INSERT ON glpi_webhooks FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='test007 injected error'"
reject_after_insert 'test007 injected error'
sql -e 'DROP TRIGGER test007_failure'
other=$(digest --ignore-table="$db.glpi_webhooks" --ignore-table="$db.glpi_webhookcategories")
run "$db"
[[ $(sql -e "SELECT COUNT(*) FROM glpi_webhooks") == 1 ]]
[[ $(sql -e "SELECT COUNT(*) FROM glpi_webhooks w JOIN glpi_webhookcategories c ON c.id=w.webhookcategories_id
    WHERE c.name='Ticket Manager' AND w.is_active=0 AND w.secret IS NULL AND w.event='new' AND w.itemtype='Ticket'
    AND w.url='$url' AND w.payload='{\"ticketId\": {{ item.id }}}' AND w.custom_headers='[]'") == 1 ]]
first=$(digest)
run "$db"
[[ "$(digest)" == "$first" && "$(digest --ignore-table="$db.glpi_webhooks" --ignore-table="$db.glpi_webhookcategories")" == "$other" ]]
echo "007 regression passed in $db"
