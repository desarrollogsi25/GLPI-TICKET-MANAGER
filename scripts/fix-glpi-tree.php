<?php
/**
 * Script de reconstrucción y sincronización del árbol de categorías ITIL en GLPI.
 * Ejecutar dentro del contenedor: php /var/www/glpi/scripts/fix-glpi-tree.php
 */

require_once __DIR__ . '/../src/Glpi/Error/StartupErrors.php';
\Glpi\Error\StartupErrors::capture();
require_once __DIR__ . '/../src/Glpi/Application/ResourcesChecker.php';
(new \Glpi\Application\ResourcesChecker(dirname(__DIR__)))->checkResources();
require_once __DIR__ . '/../vendor/autoload.php';

$kernel = new \Glpi\Kernel\Kernel();
$kernel->boot();

global $DB, $GLPI_CACHE;

echo "=== [1/4] Inicializando GLPI Kernel y comprobando categorías ===\n";

// Definición de las 7 categorías principales requeridas
$targetCategories = [
    'Requerimiento Service Desk' => ['desc' => 'Solicitud de requerimientos generales de Service Desk'],
    'Requerimiento BI'           => ['desc' => 'Solicitud de reportes y tableros BI'],
    'Aplicaciones GSI'          => ['desc' => 'Incidencias en aplicaciones internas corporativas'],
    'Periféricos'               => ['desc' => 'Problemas con teclados, mouses y periféricos'],
    'Hardware'                  => ['desc' => 'Problemas con PC, monitores y componentes físicos'],
    'Software'                  => ['desc' => 'Incidencias de software base, SO y ofimática'],
    'Informes'                  => ['desc' => 'Incidencias con planillas y extracción de datos'],
];

$categoryObj = new ITILCategory();

foreach ($targetCategories as $name => $meta) {
    $existing = (new ITILCategory())->find(['name' => $name, 'entities_id' => 0]);
    if (count($existing) > 0) {
        $first = reset($existing);
        $catId = $first['id'];
        $categoryObj->update([
            'id'                 => $catId,
            'is_helpdeskvisible' => 1,
            'is_incident'        => 1,
            'is_request'         => 1,
            'is_problem'         => 1,
            'is_change'          => 1,
            'is_recursive'       => 1,
            'itilcategories_id'  => 0,
        ]);
        echo "✓ Categoría actualizada: ID {$catId} - {$name}\n";
    } else {
        $catId = $categoryObj->add([
            'name'               => $name,
            'entities_id'        => 0,
            'is_recursive'       => 1,
            'itilcategories_id'  => 0,
            'is_helpdeskvisible' => 1,
            'is_incident'        => 1,
            'is_request'         => 1,
            'is_problem'         => 1,
            'is_change'          => 1,
            'comment'            => $meta['desc'],
        ]);
        echo "+ Categoría creada vía ITILCategory::add(): ID {$catId} - {$name}\n";
    }
}

echo "\n=== [2/4] Regenerando árbol jerárquico vía CommonTreeDropdown ===\n";
$categoryObj->regenerateTreeUnderID(0, true, true);
echo "✓ regenerateTreeUnderID(0) completado.\n";

echo "\n=== [3/4] Reconstruyendo sons_cache y ancestors_cache en MariaDB ===\n";
$dbu = new DbUtils();
$iterator = $DB->request(['FROM' => 'glpi_itilcategories']);
foreach ($iterator as $row) {
    $id = (int)$row['id'];
    $ancestors = $dbu->getAncestorsOf('glpi_itilcategories', $id);
    $sons = $dbu->getSonsOf('glpi_itilcategories', $id);
    
    // Forzar guardado persistente en DB
    $DB->update(
        'glpi_itilcategories',
        [
            'ancestors_cache' => $dbu->exportArrayToDB($ancestors),
            'sons_cache'      => $dbu->exportArrayToDB($sons),
        ],
        ['id' => $id]
    );

    echo "  - Cat [{$id}] {$row['name']}: ancestors=" . json_encode($ancestors) . " | sons=" . json_encode($sons) . "\n";
}

echo "\n=== [4/4] Limpiando caches de Symfony y GLPI ===\n";
if ($GLPI_CACHE) {
    $GLPI_CACHE->clear();
}
echo "✓ Árbol de categorías ITIL sincronizado y listo para Helpdesk.\n";
