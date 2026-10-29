#!/usr/bin/env node
/**
 * =============================================================================
 * Script de Simulación de Tickets - GLPI Ticket Manager
 * Inserta ~50 tickets de prueba realistas de forma idempotente.
 * =============================================================================
 */

const { execFileSync } = require('child_process');
const path = require('path');
const { seedGlpiUsers } = require('./seed-glpi-users');

const GUARD = path.resolve(__dirname, 'e2e/guard.mjs');

function guard(args, input) {
  try {
    return execFileSync(process.execPath, [GUARD, ...args], {
      input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error('Fixture blocked: a confirmed disposable E2E fixture is required.');
  }
}

// Refuse before users, SQL generation or any child process when no confirmed
// disposable fixture exists.
guard(['verify', '--destructive']);

// 0. Ejecutar creación e inicialización de usuarios y roles de prueba en GLPI
try {
  seedGlpiUsers();
} catch (err) {
  console.warn('[!] Advertencia al inicializar usuarios GLPI:', err.message);
}

// 2. Definir catálogo de 50 tickets realistas
const SAMPLE_TICKETS = [
  // COLA / NUEVO (Status 1) - 12 tickets (sin técnico asignado, pero en cola de grupo)
  { id: 301, name: '[SEED-01] Solicitud de acceso a módulo de reportes CRM', status: 1, priority: 3, cat: 7, group: 'Requerimiento Service Desk', content: 'El usuario requiere permisos de acceso al módulo de reportes para el cierre mensual.' },
  { id: 302, name: '[SEED-02] Monitor parpadea y muestra artefactos en puesto 14', status: 1, priority: 2, cat: 11, group: 'Hardware', content: 'El cable DisplayPort o la tarjeta integrada del equipo de atención al cliente presenta fallos.' },
  { id: 303, name: '[SEED-03] Caída de tablero analítico de ventas en PowerBI', status: 1, priority: 5, cat: 8, group: 'Requerimiento Service Desk', content: 'El tablero de control gerencial no refresca los datos desde la madrugada.' },
  { id: 304, name: '[SEED-04] Reemplazo de teclado por fallo de tecla espaciadora', status: 1, priority: 1, cat: 10, group: 'Hardware', content: 'Petición de teclado ergonómico de recambio para puesto de call center.' },
  { id: 305, name: '[SEED-05] Error al sincronizar registros en aplicativo GSI', status: 1, priority: 4, cat: 9, group: 'Requerimiento Service Desk', content: 'El módulo de facturación muestra error de concurrencia al procesar lotes.' },
  { id: 306, name: '[SEED-06] Fuente de alimentación emite zumbido anormal', status: 1, priority: 3, cat: 11, group: 'Hardware', content: 'Estación de diseño presenta ruidos eléctricos y reinicios intermitentes.' },
  { id: 307, name: '[SEED-07] Solicitud de extracción de informe consolidado anual', status: 1, priority: 3, cat: 12, group: 'Requerimiento Service Desk', content: 'Auditoría interna requiere consolidado de movimientos contables 2025.' },
  { id: 308, name: '[SEED-08] Lector de código de barras no responde por USB', status: 1, priority: 2, cat: 10, group: 'Hardware', content: 'Dispositivo Honeywell en almacén no lee etiquetas reflectantes.' },
  { id: 309, name: '[SEED-09] Instalación y configuración de suite ofimática', status: 1, priority: 2, cat: 4, group: 'Requerimiento Service Desk', content: 'Nuevo ingreso en RRHH requiere instalación de paquete ofimático.' },
  { id: 310, name: '[SEED-10] Portátil no enciende tras corte de energía eléctrica', status: 1, priority: 4, cat: 11, group: 'Hardware', content: 'El equipo ThinkPad no enciende ni muestra LED de carga de batería.' },
  { id: 311, name: '[SEED-11] Alta de usuario y buzón para nueva incorporación', status: 1, priority: 3, cat: 7, group: 'Requerimiento Service Desk', content: 'Crear credenciales corporativas y asignar a lista de distribución general.' },
  { id: 312, name: '[SEED-12] Sustitución de conector RJ45 dañado en roseta de red', status: 1, priority: 3, cat: 11, group: 'Hardware', content: 'Pestaña plástica rota provoca desconexiones continuas de red local.' },

  // ASIGNADO (Status 2) - 10 tickets
  { id: 313, name: '[SEED-13] Configuración de firma digital en Adobe Acrobat', status: 2, priority: 3, cat: 7, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Asistir al departamento legal en la importación de certificado FNMT en formato PFX.' },
  { id: 314, name: '[SEED-14] Equipo se apaga repentinamente tras 20 minutos de uso', status: 2, priority: 4, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Posible sobrecalentamiento de la CPU por fallo en disipador térmico.' },
  { id: 315, name: '[SEED-15] Desbloqueo de permisos para extracción de métricas BI', status: 2, priority: 2, cat: 8, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Autorización temporal para extraer logs de auditoría industrial.' },
  { id: 316, name: '[SEED-16] Migración de disco mecánico a SSD en puesto administrativo', status: 2, priority: 3, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Clonación de disco y optimización de arranque en equipo de oficina.' },
  { id: 317, name: '[SEED-17] Error en carga de comprobantes en sistema GSI', status: 2, priority: 3, cat: 9, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Conflicto de validación bloquea la subida de expedientes compartidos.' },
  { id: 318, name: '[SEED-18] Batería de portátil no retiene carga más de 15 minutos', status: 2, priority: 3, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Portátil Dell Latitude requiere cambio de celda de batería por degradación.' },
  { id: 319, name: '[SEED-19] Creación de plantilla de informe mensual en Excel', status: 2, priority: 2, cat: 12, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Automatización de fórmulas de cálculo de impuestos en plantilla corporativa.' },
  { id: 320, name: '[SEED-20] Auricular de soporte con cable cortado en conector jack', status: 2, priority: 2, cat: 10, tech: 'tecnico_test2', group: 'Hardware', content: 'Auriculares Jabra USB con conector dañado requieren sustitución.' },
  { id: 321, name: '[SEED-21] Configuración de perfil de correo en Outlook móvil', status: 2, priority: 2, cat: 7, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Configuración segura mediante autenticación moderna en dispositivo Android.' },
  { id: 322, name: '[SEED-22] Ampliación de memoria RAM a 32GB para equipo de arquitectura', status: 2, priority: 3, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Instalación de dos módulos DDR5 de 16GB para trabajo en CAD 3D.' },

  // EN PROGRESO (Status 3) - 10 tickets
  { id: 323, name: '[SEED-23] Diagnóstico de lentitud en consultas del aplicativo GSI', status: 3, priority: 4, cat: 9, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Análisis de trazas de ejecución en base de datos para detectar cuellos de botella.' },
  { id: 324, name: '[SEED-24] Reemplazo de placa base por fallo en chipset de audio', status: 3, priority: 3, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Sustitución en garantía coordinada con servicio técnico oficial HP.' },
  { id: 325, name: '[SEED-25] Ajuste en pipeline de transformación de datos BI', status: 3, priority: 4, cat: 8, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Corrección de tipo de dato numérico en carga incremental de facturación.' },
  { id: 326, name: '[SEED-26] Limpieza interna y cambio de pasta térmica en servidor local', status: 3, priority: 3, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Mantenimiento preventivo programado para reducir temperatura operativa.' },
  { id: 327, name: '[SEED-27] Regularización de licencias de software ofimático', status: 3, priority: 3, cat: 4, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Reasignación de suscripciones Microsoft 365 tras rotación de personal.' },
  { id: 328, name: '[SEED-28] Sustitución de rodillo de arrastre en impresora multifunción', status: 3, priority: 3, cat: 10, tech: 'tecnico_test2', group: 'Hardware', content: 'Kit de mantenimiento MK-3130 recibido, instalación en curso.' },
  { id: 329, name: '[SEED-29] Depuración de formato en exportación de informes fiscales', status: 3, priority: 4, cat: 12, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'El archivo TXT generado no cumple especificación de longitud de campos.' },
  { id: 330, name: '[SEED-30] Instalación de switch de 24 puertos Gigabit en rack B', status: 3, priority: 4, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Montaje en bastidor y etiquetado de latiguillos de parcheo Cat6.' },
  { id: 331, name: '[SEED-31] Configuración de flujos de aprobación en portal interno', status: 3, priority: 3, cat: 7, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Implementación de matriz de autorización según importe de compra.' },
  { id: 332, name: '[SEED-32] Revisión de SAI (UPS) ante alerta de fallo en batería', status: 3, priority: 4, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Verificación de voltaje en celdas de batería de respaldo de CPD.' },

  // PENDIENTE (Status 4) - 9 tickets
  { id: 333, name: '[SEED-33] En espera de confirmación de usuario para validar informe', status: 4, priority: 2, cat: 12, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Se envió borrador de reporte a la jefa de contabilidad para su aprobación.' },
  { id: 334, name: '[SEED-34] Esperando entrega de piezas de repuesto por distribuidor', status: 4, priority: 3, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Se solicitó cotización de fuente de alimentación redundante a distribuidor oficial.' },
  { id: 335, name: '[SEED-35] En espera de respuesta de soporte externo del software ERP', status: 4, priority: 3, cat: 9, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Caso de soporte abierto con fabricante por excepción no controlada.' },
  { id: 336, name: '[SEED-36] A la espera de recepción de dock station Thunderbolt', status: 4, priority: 2, cat: 10, tech: 'tecnico_test2', group: 'Hardware', content: 'El transportista indica entrega prevista para mañana antes de las 14:00.' },
  { id: 337, name: '[SEED-37] En espera de especificación funcional para nuevo tablero BI', status: 4, priority: 2, cat: 8, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Se requiere definición de KPIs por parte de la dirección comercial.' },
  { id: 338, name: '[SEED-38] Esperando retirada de monitor defectuoso por servicio de garantía', status: 4, priority: 2, cat: 11, tech: 'tecnico_test2', group: 'Hardware', content: 'Número de RMA asignado, a la espera de mensajero de recogida.' },
  { id: 339, name: '[SEED-39] En espera de visto bueno para actualización de versión de software', status: 4, priority: 3, cat: 4, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Esperando ventana sin operaciones críticas autorizada por jefatura.' },
  { id: 340, name: '[SEED-40] A la espera de ratón vertical ergonómico solicitado a compras', status: 4, priority: 1, cat: 10, tech: 'tecnico_test2', group: 'Hardware', content: 'Petición con prescripción de prevención de riesgos laborales tramitada.' },
  { id: 341, name: '[SEED-41] En espera de datos de acceso de capacitación externa', status: 4, priority: 2, cat: 7, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', content: 'Solicitud enviada al proveedor de formación para emisión de credenciales.' },

  // RESUELTO (Status 5) - 9 tickets
  { id: 342, name: '[SEED-42] Restablecimiento de credenciales de acceso a portal corporativo', status: 5, priority: 3, cat: 7, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', sol: 'Se regeneró la contraseña temporal y se verificó el login correcto junto al usuario.', content: 'Usuario no recordaba contraseña tras retorno de vacaciones.' },
  { id: 343, name: '[SEED-43] Sustitución de cable HDMI en sala de videoconferencias B', status: 5, priority: 3, cat: 11, tech: 'tecnico_test2', group: 'Hardware', sol: 'Cable defectuoso sustituido por cable HDMI 2.1 apantallado. Audio y vídeo probados con éxito.', content: 'Pantalla parpadeaba durante reuniones por Teams.' },
  { id: 344, name: '[SEED-44] Actualización de fórmula de cálculo en tablero de ventas', status: 5, priority: 2, cat: 8, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', sol: 'Modificada medida DAX para incluir devoluciones del trimestre anterior.', content: 'El total de ventas no cuadraba con el cierre de caja de Tesorería.' },
  { id: 345, name: '[SEED-45] Limpieza de cabezales y calibración de escáner departamental', status: 5, priority: 2, cat: 10, tech: 'tecnico_test2', group: 'Hardware', sol: 'Cabezales ópticos limpiados con alcohol isopropílico y calibración ejecutada con hoja patrón.', content: 'Líneas negras verticales aparecían en los documentos digitalizados.' },
  { id: 346, name: '[SEED-46] Corrección de error de conexión en aplicativo GSI', status: 5, priority: 3, cat: 9, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', sol: 'Actualizado string de conexión y reiniciado pool de conexiones del servidor web.', content: 'El aplicativo mostraba error de timeout intermitente al inicio de jornada.' },
  { id: 347, name: '[SEED-47] Reemplazo de pila CMOS CR2032 en equipo que perdía la hora', status: 5, priority: 2, cat: 11, tech: 'tecnico_test2', group: 'Hardware', sol: 'Pila cambiada y hora configurada en BIOS/UEFI. Comprobado arranque en frío.', content: 'El equipo solicitaba pulsar F1 en cada encendido para reiniciar fecha.' },
  { id: 348, name: '[SEED-48] Generación y entrega de extracto de nóminas consolidado', status: 5, priority: 2, cat: 12, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', sol: 'Ejecutado script de extracción y validada integridad con departamento de RRHH.', content: 'Petición urgente para auditoría laboral semestral.' },
  { id: 349, name: '[SEED-49] Sustitución de ratón inalámbrico por fallo de sensor', status: 5, priority: 1, cat: 10, tech: 'tecnico_test2', group: 'Hardware', sol: 'Entregado ratón Logitech óptico nuevo en el puesto de recepción.', content: 'El puntero saltaba de forma errática en pantalla.' },
  { id: 350, name: '[SEED-50] Instalación de visor de modelos 3D autorizado', status: 5, priority: 2, cat: 4, tech: 'tecnico_test1', group: 'Requerimiento Service Desk', sol: 'Instalado Autodesk Viewer y asociado a extensiones DWG y DXF.', content: 'Puesto de compras requiere revisar planos técnicos sin licencia completa de CAD.' }
];

console.log(`[+] Generando script SQL para ${SAMPLE_TICKETS.length} tickets de simulación...`);

let sqlStatements = [];

for (const t of SAMPLE_TICKETS) {
  const safeName = t.name.replace(/'/g, "''");
  const safeContent = t.content.replace(/'/g, "''");
  const urgency = t.priority >= 4 ? 4 : 3;
  const impact = t.priority >= 4 ? 4 : 3;
  const groupName = t.group || (t.id % 2 === 0 ? 'Requerimiento Service Desk' : 'Hardware');

  // Insertar o actualizar ticket en glpi_tickets
  sqlStatements.push(`
INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)
VALUES (${t.id}, 0, '${safeName}', NOW(), NOW(), ${t.status}, 3, '${safeContent}', ${urgency}, ${impact}, ${t.priority}, 1, 1, ${t.cat})
ON DUPLICATE KEY UPDATE 
  name = '${safeName}',
  content = '${safeContent}',
  status = ${t.status},
  priority = ${t.priority},
  itilcategories_id = ${t.cat},
  date_mod = NOW();
`);

  // Asignar al grupo correspondiente (Requerimiento Service Desk o Hardware)
  sqlStatements.push(`
DELETE FROM glpi_groups_tickets WHERE tickets_id = ${t.id};
INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type)
SELECT ${t.id}, g.id, 2 FROM glpi_groups g WHERE g.name = '${groupName}';
`);

  // Asignar solicitante (solicitante_test)
  sqlStatements.push(`
DELETE FROM glpi_tickets_users WHERE tickets_id = ${t.id} AND type = 1;
INSERT INTO glpi_tickets_users (tickets_id, users_id, type)
SELECT ${t.id}, u.id, 1 FROM glpi_users u WHERE u.name = 'solicitante_test';
`);

  // Asignar técnico si aplica (idempotente: limpiar relación previa de asignado)
  sqlStatements.push(`
DELETE FROM glpi_tickets_users WHERE tickets_id = ${t.id} AND type = 2;
`);
  if (t.tech) {
    const techUsername = t.tech;
    const legacyTech = techUsername === 'tecnico_test1' ? 'tech1' : 'tech2';
    sqlStatements.push(`
INSERT INTO glpi_tickets_users (tickets_id, users_id, type)
SELECT ${t.id}, u.id, 2 FROM glpi_users u WHERE u.name IN ('${techUsername}', '${legacyTech}');
`);
  }

  // Solución para tickets resueltos
  if (t.status === 5 && t.sol) {
    const safeSol = t.sol.replace(/'/g, "''");
    const techUser = t.tech || 'tecnico_test1';
    sqlStatements.push(`
DELETE FROM glpi_itilsolutions WHERE items_id = ${t.id} AND itemtype = 'Ticket';
INSERT INTO glpi_itilsolutions (itemtype, items_id, solutiontypes_id, content, date_creation, date_mod, users_id, status)
SELECT 'Ticket', ${t.id}, 1, '${safeSol}', NOW(), NOW(), u.id, 2
FROM glpi_users u WHERE u.name = '${techUser}' LIMIT 1;
UPDATE glpi_tickets SET solvedate = NOW() WHERE id = ${t.id};
`);
  }
}

const fullSql = sqlStatements.join('\n');

console.log(`[+] Ejecutando inserción en base de datos MariaDB (glpi)...`);

try {
  guard(['sql', 'mariadb'], fullSql);
  console.log(`[+] Éxito: ${SAMPLE_TICKETS.length} tickets de simulación insertados/actualizados correctamente.`);
} catch (err) {
  console.error(`[-] Error al ejecutar inserción SQL: ${err.message}`);
  process.exit(1);
}
