#!/usr/bin/env node
/**
 * =============================================================================
 * Script de Simulación de Tickets - GLPI Ticket Manager
 * Inserta ~50 tickets de prueba realistas de forma idempotente.
 * =============================================================================
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Obtener credenciales desde .env o variables de entorno
let mariadbPassword = process.env.MARIADB_PASSWORD;
let mariadbDatabase = process.env.MARIADB_DATABASE || 'glpi';
let mariadbUser = process.env.MARIADB_USER || 'glpi';

if (!mariadbPassword) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^MARIADB_PASSWORD=(.*)$/m);
    if (match) mariadbPassword = match[1].trim();
  }
}

if (!mariadbPassword) {
  mariadbPassword = 'secret'; // fallback
}

// 2. Definir catálogo de 50 tickets realistas
const SAMPLE_TICKETS = [
  // COLA / NUEVO (Status 1) - 12 tickets
  { id: 101, name: '[SEED-01] Atasco constante de papel en impresora de Planta 2', status: 1, priority: 3, cat: 2, content: 'La bandeja 2 de la impresora HP multifunción de contabilidad atasca las hojas continuamente.' },
  { id: 102, name: '[SEED-02] Solicitud de acceso a carpeta compartida de Marketing', status: 1, priority: 2, cat: 3, content: 'El usuario requiere permisos de lectura y escritura en la unidad de red MKT_2026.' },
  { id: 103, name: '[SEED-03] Caída de conexión WiFi en sala de juntas principal', status: 1, priority: 5, cat: 6, content: 'El punto de acceso AP-SALA-01 no asigna direcciones IP por DHCP durante la reunión directiva.' },
  { id: 104, name: '[SEED-04] Bloqueo de cuenta de correo por intentos fallidos', status: 1, priority: 4, cat: 3, content: 'El usuario introdujo la contraseña errónea en Outlook móvil y la cuenta quedó suspendida.' },
  { id: 105, name: '[SEED-05] Instalación de cliente VPN para empleado en teletrabajo', status: 1, priority: 3, cat: 4, content: 'Se necesita instalar y configurar cliente OpenVPN en el portátil corporativo asignado.' },
  { id: 106, name: '[SEED-06] Monitor parpadea y muestra artefactos en puesto 14', status: 1, priority: 2, cat: 2, content: 'El cable DisplayPort o la tarjeta integrada del equipo de atención al cliente presenta fallos.' },
  { id: 107, name: '[SEED-07] Error 500 al generar reporte mensual de nóminas en ERP', status: 1, priority: 4, cat: 5, content: 'El módulo de nóminas lanza excepción por tiempo de espera al exportar en formato Excel.' },
  { id: 108, name: '[SEED-08] Reemplazo de teclado por fallo de tecla espaciadora', status: 1, priority: 1, cat: 2, content: 'Petición de teclado ergonómico de recambio para puesto de call center.' },
  { id: 109, name: '[SEED-09] Solicitud de licencia para Microsoft Visio', status: 1, priority: 2, cat: 4, content: 'Diseñador de procesos requiere licencia estándar para modelado de flujos BPMN.' },
  { id: 110, name: '[SEED-10] Alerta de espacio en disco en servidor de backup secundario', status: 1, priority: 4, cat: 6, content: 'El volumen /mnt/backup-nas se encuentra al 93% de su capacidad total.' },
  { id: 111, name: '[SEED-11] Auricular de call center sin recepción de audio en canal derecho', status: 1, priority: 3, cat: 2, content: 'Auriculares Jabra USB con conector dañado requieren sustitución.' },
  { id: 112, name: '[SEED-12] Notificaciones de spam masivo desde remitente falso', status: 1, priority: 4, cat: 6, content: 'Varios usuarios reportan correos con enlaces sospechosos solicitando credenciales bancarias.' },

  // ASIGNADO (Status 2) - 10 tickets
  { id: 113, name: '[SEED-13] Configuración de firma digital en Adobe Acrobat', status: 2, priority: 3, cat: 4, tech: 7, content: 'Asistir al departamento legal en la importación de certificado FNMT en formato PFX.' },
  { id: 114, name: '[SEED-14] Equipo se apaga repentinamente tras 20 minutos de uso', status: 2, priority: 4, cat: 2, tech: 7, content: 'Posible sobrecalentamiento de la CPU por fallo en disipador térmico.' },
  { id: 115, name: '[SEED-15] Desbloqueo de puerto USB para transferencia autorizada', status: 2, priority: 2, cat: 3, tech: 8, content: 'Autorización temporal para extraer logs de auditoría industrial mediante pendrive cifrado.' },
  { id: 116, name: '[SEED-16] Migración de perfil de usuario a nuevo equipo portátil', status: 2, priority: 3, cat: 3, tech: 7, content: 'Transferencia de documentos, certificados y configuración de correo a ThinkPad T14.' },
  { id: 117, name: '[SEED-17] Error en sincronización de OneDrive con carpetas compartidas', status: 2, priority: 3, cat: 5, tech: 8, content: 'Conflicto de versiones bloquea la subida de expedientes compartidos.' },
  { id: 118, name: '[SEED-18] Solicitud de alta de buzón compartido para soporte@empresa.com', status: 2, priority: 3, cat: 3, tech: 7, content: 'Crear buzón en Exchange Online y asignar permisos de envío a 5 agentes.' },
  { id: 119, name: '[SEED-19] Batería de portátil no retiene carga más de 15 minutos', status: 2, priority: 3, cat: 2, tech: 8, content: 'Portátil Dell Latitude requiere cambio de celda de batería por degradación.' },
  { id: 120, name: '[SEED-20] Asignación de rol de supervisor en plataforma de helpdesk', status: 2, priority: 4, cat: 3, tech: 7, content: 'Promoción interna: agregar permisos para gestión de colas de tickets.' },
  { id: 121, name: '[SEED-21] Configuración de acceso RDP para servidor de desarrollo', status: 2, priority: 2, cat: 6, tech: 8, content: 'Habilitar regla en cortafuegos interno para IP de desarrollador senior.' },
  { id: 122, name: '[SEED-22] Lentitud en aplicación CRM al filtrar por clientes activos', status: 2, priority: 3, cat: 5, tech: 7, content: 'Se investiga necesidad de optimización de índices en consulta relacional.' },

  // EN PROGRESO (Status 3) - 10 tickets
  { id: 123, name: '[SEED-23] Diagnóstico de caída de enlace de fibra óptica en Sede Norte', status: 3, priority: 5, cat: 6, tech: 7, content: 'Incidencia abierta con operador de telecomunicaciones tras corte físico de fibra.' },
  { id: 124, name: '[SEED-24] Reinstalación de sistema operativo Windows 11 por corrupción', status: 3, priority: 3, cat: 4, tech: 7, content: 'BSOD recurrente por fallo en controlador de almacenamiento NVMe. Formateo en curso.' },
  { id: 125, name: '[SEED-25] Despliegue de actualización crítica de seguridad en servidores web', status: 3, priority: 5, cat: 6, tech: 8, content: 'Parcheado de vulnerabilidad en Nginx en ventana de mantenimiento autorizada.' },
  { id: 126, name: '[SEED-26] Configuración de túnel IPSec entre oficinas centrales y almacén', status: 3, priority: 4, cat: 6, tech: 7, content: 'Enrutamiento de subredes 192.168.10.0/24 y 192.168.20.0/24 mediante routers Cisco.' },
  { id: 127, name: '[SEED-27] Análisis forense tras detección de malware en endpoint', status: 3, priority: 5, cat: 6, tech: 8, content: 'Aislamiento de red del equipo infectado y escaneo completo con EDR.' },
  { id: 128, name: '[SEED-28] Automatización de backups incrementales en PostgreSQL', status: 3, priority: 3, cat: 6, tech: 7, content: 'Script cron con pg_dump y rotación a bucket S3 compatible con retención de 30 días.' },
  { id: 129, name: '[SEED-29] Renovación de certificados SSL wildcard *.dominio.com', status: 3, priority: 4, cat: 6, tech: 8, content: 'Certificados expiran en 10 días. Verificación de reto DNS con Let’s Encrypt.' },
  { id: 130, name: '[SEED-30] Depuración de timeout en webhook de integración de pagos', status: 3, priority: 4, cat: 5, tech: 7, content: 'Pasarela de pagos reporta reintentos agotados por latencia superior a 10s.' },
  { id: 131, name: '[SEED-31] Pruebas de conmutación por error en clúster de alta disponibilidad', status: 3, priority: 4, cat: 6, tech: 8, content: 'Simulación de fallo en nodo primario para validar failover automático de MariaDB.' },
  { id: 132, name: '[SEED-32] Auditoría de cuentas inactivas con más de 90 días sin login', status: 3, priority: 2, cat: 3, tech: 7, content: 'Listado de usuarios a deshabilitar conforme a política de seguridad ISO 27001.' },

  // PENDIENTE (Status 4) - 9 tickets
  { id: 133, name: '[SEED-33] Pendiente de recibir presupuesto de pieza de repuesto para servidor', status: 4, priority: 3, cat: 2, tech: 7, content: 'Se solicitó cotización de fuente de alimentación redundante a distribuidor oficial.' },
  { id: 134, name: '[SEED-34] Esperando confirmación de usuario para reiniciar router de planta', status: 4, priority: 3, cat: 6, tech: 8, content: 'Se requiere ventana sin operaciones críticas para aplicar reinicio de firmware.' },
  { id: 135, name: '[SEED-35] Pendiente de validación de responsable para alta de permisos', status: 4, priority: 2, cat: 3, tech: 7, content: 'Esperando visto bueno por escrito de la dirección de departamento.' },
  { id: 136, name: '[SEED-36] A la espera de entrega de terminal telefónico IP por mensajería', status: 4, priority: 2, cat: 2, tech: 8, content: 'El transportista indica entrega prevista para mañana antes de las 14:00.' },
  { id: 137, name: '[SEED-37] Solicitud de información adicional sobre error de facturación', status: 4, priority: 3, cat: 5, tech: 7, content: 'Se solicitó captura de pantalla y número de factura al usuario solicitante.' },
  { id: 138, name: '[SEED-38] Esperando llegada de técnico externo para revisión de climatización', status: 4, priority: 4, cat: 6, tech: 8, content: 'Alarma de temperatura en CPD. Proveedor de refrigeración notificado.' },
  { id: 139, name: '[SEED-39] Pendiente de aprobación de presupuesto para ampliación de RAM', status: 4, priority: 2, cat: 2, tech: 7, content: 'Estación de trabajo de renderizado requiere 64GB DDR5 adicionales.' },
  { id: 140, name: '[SEED-40] A la espera de respuesta de soporte del fabricante por bug de firmware', status: 4, priority: 3, cat: 6, tech: 8, content: 'Ticket de soporte N3 abierto con el fabricante del conmutador de red.' },
  { id: 141, name: '[SEED-41] Pendiente de cita presencial con usuario para cambio de equipo', status: 4, priority: 2, cat: 2, tech: 7, content: 'Usuario se encuentra de viaje de trabajo hasta el lunes próximo.' },

  // RESUELTO (Status 5) - 9 tickets
  { id: 142, name: '[SEED-42] Restablecimiento de credenciales de acceso a portal de empleados', status: 5, priority: 3, cat: 3, tech: 7, sol: 'Se regeneró la contraseña temporal y se verificó el login correcto junto al usuario.', content: 'Usuario no recordaba contraseña tras retorno de vacaciones.' },
  { id: 143, name: '[SEED-43] Sustitución de cable HDMI en sala de videoconferencias B', status: 5, priority: 3, cat: 2, tech: 8, sol: 'Cable defectuoso sustituido por cable HDMI 2.1 apantallado. Audio y vídeo probados con éxito.', content: 'Pantalla parpadeaba durante reuniones por Teams.' },
  { id: 144, name: '[SEED-44] Configuración de impresora virtual PDF en puesto de facturación', status: 5, priority: 2, cat: 4, tech: 7, sol: 'Instalado controlador Microsoft Print to PDF y configurada como predeterminada.', content: 'El sistema de contabilidad no permitía exportar facturas electrónicas a PDF.' },
  { id: 145, name: '[SEED-45] Liberación de espacio en disco en estación de diseño gráfico', status: 5, priority: 3, cat: 2, tech: 8, sol: 'Purgados 120 GB de archivos temporales de Adobe Cache y reubicados proyectos antiguos en NAS.', content: 'Disco C sin espacio impedía renderizar vídeos promocionales.' },
  { id: 146, name: '[SEED-46] Asignación de permisos de acceso a nueva sala de Teams', status: 5, priority: 2, cat: 3, tech: 7, sol: 'Canal privado configurado con permisos para los 8 miembros del comité organizador.', content: 'Comité de auditoría requería canal confidencial de comunicación.' },
  { id: 147, name: '[SEED-47] Reemplazo de ratón inalámbrico por fallo de sensor óptico', status: 5, priority: 1, cat: 2, tech: 8, sol: 'Entregado ratón Logitech óptico nuevo en el puesto de recepción.', content: 'El puntero saltaba de forma errática en pantalla.' },
  { id: 148, name: '[SEED-48] Corrección de hora del sistema desfasada en terminal de control horario', status: 5, priority: 4, cat: 6, tech: 7, sol: 'Reconfigurado servidor NTP corporativo en el dispositivo biométrico. Hora sincronizada al segundo.', content: 'Fichajes se registraban con 15 minutos de retraso.' },
  { id: 149, name: '[SEED-49] Activación de buzón de voz y desvío de llamadas en teléfono IP', status: 5, priority: 2, cat: 2, tech: 8, sol: 'Regla de desvío tras 4 tonos activada hacia buzón de voz con notificación por email.', content: 'Agente requería recibir audios cuando se encuentra en atención presencial.' },
  { id: 150, name: '[SEED-50] Verificación de backup y restauración de prueba en ambiente de test', status: 5, priority: 4, cat: 6, tech: 7, sol: 'Restauración completa efectuada en base de datos de pruebas. Integridad de tablas comprobada.', content: 'Simulacro trimestral de recuperación de datos conforme a ISO 27001.' }
];

console.log(`[+] Generando script SQL para ${SAMPLE_TICKETS.length} tickets de simulación...`);

let sqlStatements = [];

for (const t of SAMPLE_TICKETS) {
  const safeName = t.name.replace(/'/g, "''");
  const safeContent = t.content.replace(/'/g, "''");
  const urgency = t.priority >= 4 ? 4 : 3;
  const impact = t.priority >= 4 ? 4 : 3;

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

  // Asignar al grupo Call Center (group 1)
  sqlStatements.push(`
INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type)
VALUES (${t.id}, 1, 2)
ON DUPLICATE KEY UPDATE groups_id = 1, type = 2;
`);

  // Asignar técnico si aplica
  if (t.tech) {
    sqlStatements.push(`
INSERT INTO glpi_tickets_users (tickets_id, users_id, type)
VALUES (${t.id}, ${t.tech}, 2)
ON DUPLICATE KEY UPDATE users_id = ${t.tech}, type = 2;
`);
  } else {
    sqlStatements.push(`
DELETE FROM glpi_tickets_users WHERE tickets_id = ${t.id} AND type = 2;
`);
  }

  // Solución para tickets resueltos
  if (t.status === 5 && t.sol) {
    const safeSol = t.sol.replace(/'/g, "''");
    sqlStatements.push(`
DELETE FROM glpi_itilsolutions WHERE items_id = ${t.id} AND itemtype = 'Ticket';
INSERT INTO glpi_itilsolutions (itemtype, items_id, solutiontypes_id, content, date_creation, date_mod, users_id, status)
VALUES ('Ticket', ${t.id}, 1, '${safeSol}', NOW(), NOW(), ${t.tech || 7}, 2);
UPDATE glpi_tickets SET solvedate = NOW() WHERE id = ${t.id};
`);
  }
}

const fullSql = sqlStatements.join('\n');
const tmpSqlPath = path.resolve(__dirname, 'seed-data.sql');
fs.writeFileSync(tmpSqlPath, fullSql, 'utf8');

console.log(`[+] Ejecutando inserción en base de datos MariaDB (glpi)...`);

try {
  execSync(`docker compose exec -T glpi-db mariadb -u ${mariadbUser} -p"${mariadbPassword}" ${mariadbDatabase} < "${tmpSqlPath}"`, {
    stdio: 'inherit'
  });
  console.log(`[+] Éxito: ${SAMPLE_TICKETS.length} tickets de simulación insertados/actualizados correctamente.`);
} catch (err) {
  console.error(`[-] Error al ejecutar inserción SQL: ${err.message}`);
  process.exit(1);
} finally {
  if (fs.existsSync(tmpSqlPath)) {
    fs.unlinkSync(tmpSqlPath);
  }
}
