<?php
/**
 * Script de reconstrucción y sincronización del árbol jerárquico de 16 categorías ITIL en GLPI 11.
 * Ejecutar dentro del contenedor GLPI: php /var/www/glpi/scripts/fix-glpi-tree.php
 */

require_once __DIR__ . '/../src/Glpi/Error/StartupErrors.php';
\Glpi\Error\StartupErrors::capture();
require_once __DIR__ . '/../src/Glpi/Application/ResourcesChecker.php';
(new \Glpi\Application\ResourcesChecker(dirname(__DIR__)))->checkResources();
require_once __DIR__ . '/../vendor/autoload.php';

$kernel = new \Glpi\Kernel\Kernel();
$kernel->boot();

global $DB, $GLPI_CACHE;

echo "=== [1/4] Inicializando GLPI Kernel y verificando árbol de 16 categorías ITIL ===\n";

$categoryObj = new ITILCategory();

// Árbol jerárquico oficial (6 categorías raíz + 10 subcategorías) y su mapeo a los 3 grupos técnicos:
// Grupo 1 = Desarrollo | Grupo 2 = BI | Grupo 3 = Service Desk
$hierarchy = [
    // Raíces (Nivel 1, parent = 0)
    1  => ['parent' => 0,  'group' => 1, 'name' => 'Desarrollo',       'completename' => 'Desarrollo',                       'desc' => 'Área de ingeniería de software, desarrollo y mantenimiento de aplicaciones.'],
    2  => ['parent' => 0,  'group' => 3, 'name' => 'Requerimiento',    'completename' => 'Requerimiento',                    'desc' => 'Solicitudes generales de acceso, permisos y servicios corporativos.'],
    5  => ['parent' => 0,  'group' => 1, 'name' => 'Aplicaciones',     'completename' => 'Aplicaciones',                     'desc' => 'Soporte e incidencias generales sobre el catálogo de aplicaciones.'],
    6  => ['parent' => 0,  'group' => 3, 'name' => 'Sistema',          'completename' => 'Sistema',                          'desc' => 'Infraestructura tecnológica, sistemas operativos, redes y conectividad.'],
    7  => ['parent' => 0,  'group' => 3, 'name' => 'Service Desk',     'completename' => 'Service Desk',                     'desc' => 'Solicitud de requerimientos como fichas del CRM, Accesos de Capacitación, etc.'],
    10 => ['parent' => 0,  'group' => 2, 'name' => 'BI',               'completename' => 'BI',                               'desc' => 'Inteligencia de negocios, analítica de datos, tableros y reportería.'],
    // Subcategorías (Nivel 2)
    3  => ['parent' => 2,  'group' => 3, 'name' => 'Acceso a sistema', 'completename' => 'Requerimiento > Acceso a sistema', 'desc' => 'Solicitud de altas de usuario, permisos, credenciales y accesos a sistemas corporativos.'],
    4  => ['parent' => 1,  'group' => 1, 'name' => 'Software',         'completename' => 'Desarrollo > Software',            'desc' => 'Ticket relacionado con las incidencias que se presentan en software base, ofimática y sistemas operativos.'],
    9  => ['parent' => 1,  'group' => 1, 'name' => 'Aplicaciones GSI', 'completename' => 'Desarrollo > Aplicaciones GSI',    'desc' => 'Ticket relacionado con las incidencias presentadas por los aplicativos internos y corporativos.'],
    11 => ['parent' => 1,  'group' => 1, 'name' => 'Dev',              'completename' => 'Desarrollo > Dev',                 'desc' => 'Solicitudes de desarrollo evolutivo, integraciones técnicas y ajustes de código.'],
    14 => ['parent' => 10, 'group' => 2, 'name' => 'Requerimiento BI', 'completename' => 'BI > Requerimiento BI',            'desc' => 'Solicitud de requerimientos dirigidos al área de BI, reportes y tableros analíticos.'],
    18 => ['parent' => 10, 'group' => 2, 'name' => 'Informes',         'completename' => 'BI > Informes',                    'desc' => 'Ticket relacionado con las incidencias que se presentan en los informes, extracciones de datos o planillas.'],
    15 => ['parent' => 7,  'group' => 3, 'name' => 'Call Center',      'completename' => 'Service Desk > Call Center',       'desc' => 'Incidencias y requerimientos operativos de puestos y telefonía de Call Center.'],
    16 => ['parent' => 7,  'group' => 3, 'name' => 'Hardware',         'completename' => 'Service Desk > Hardware',          'desc' => 'Ticket relacionado a los problemas que se presentan con el Monitor, PC, fuentes o componentes físicos.'],
    17 => ['parent' => 7,  'group' => 3, 'name' => 'Soporte Nivel 1',  'completename' => 'Service Desk > Soporte Nivel 1',   'desc' => 'Asistencia técnica de primer nivel y atención inicial al usuario.'],
    19 => ['parent' => 7,  'group' => 3, 'name' => 'Periféricos',      'completename' => 'Service Desk > Periféricos',       'desc' => 'Ticket relacionado a los problemas que se presentan con los periféricos (teclado, mouse, lector, etc.).'],
];

foreach ($hierarchy as $id => $meta) {
    $level = $meta['parent'] === 0 ? 1 : 2;
    $DB->updateOrInsert(
        'glpi_itilcategories',
        [
            'entities_id'        => 0,
            'is_recursive'       => 1,
            'itilcategories_id'  => $meta['parent'],
            'name'               => $meta['name'],
            'completename'       => $meta['completename'],
            'comment'            => $meta['desc'],
            'level'              => $level,
            'groups_id'          => $meta['group'],
            'is_helpdeskvisible' => 1,
            'is_incident'        => 1,
            'is_request'         => 1,
            'is_problem'         => 1,
            'is_change'          => 1,
        ],
        ['id' => $id]
    );
    echo "✓ Categoría reconciliada: ID {$id} - {$meta['completename']} (Grupo {$meta['group']})\n";
}

echo "\n=== [2/4] Regenerando árbol jerárquico vía CommonTreeDropdown ===\n";
$categoryObj->regenerateTreeUnderID(0, true, true);
echo "✓ regenerateTreeUnderID(0, true, true) completado.\n";

echo "\n=== [3/4] Reconstruyendo sons_cache y ancestors_cache en MariaDB ===\n";
$dbu = new DbUtils();
$iterator = $DB->request(['FROM' => 'glpi_itilcategories', 'ORDER' => 'id ASC']);
foreach ($iterator as $row) {
    $id = (int)$row['id'];
    $ancestors = $dbu->getAncestorsOf('glpi_itilcategories', $id);
    $sons = $dbu->getSonsOf('glpi_itilcategories', $id);

    $DB->update(
        'glpi_itilcategories',
        [
            'ancestors_cache' => $dbu->exportArrayToDB($ancestors),
            'sons_cache'      => $dbu->exportArrayToDB($sons),
        ],
        ['id' => $id]
    );

    echo "  - Cat [{$id}] {$row['completename']}: level={$row['level']} | ancestors=" . json_encode($ancestors) . " | sons=" . json_encode($sons) . "\n";
}

echo "\n=== [4/4] Limpiando caches de Symfony y GLPI ===\n";
if ($GLPI_CACHE) {
    $GLPI_CACHE->clear();
}
echo "✓ Árbol de 16 categorías ITIL sincronizado y listo para Helpdesk.\n";
