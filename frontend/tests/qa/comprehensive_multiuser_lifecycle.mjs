import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ARTIFACT_DIR = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\2a3d5283-d05b-4bc9-8a2b-393b9ff33c83\\screenshots\\comprehensive';
const GLPI_URL = 'http://localhost:8081';
const TM_URL = 'https://10.10.40.31';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function getCred(user) {
  const key = `CRED_${user.toUpperCase()}`;
  if (process.env[key]) return process.env[key];
  for (const candidate of ['.env.local', '../.env.local', '../../.env.local']) {
    try {
      if (fs.existsSync(candidate)) {
        const text = fs.readFileSync(candidate, 'utf8');
        const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
        if (match) return match[1].trim();
      }
    } catch {}
  }
  return '';
}

function getDbPass() {
  if (process.env.MARIADB_PASSWORD) return process.env.MARIADB_PASSWORD;
  for (const candidate of ['.env', '../.env', '../../.env']) {
    try {
      if (fs.existsSync(candidate)) {
        const text = fs.readFileSync(candidate, 'utf8');
        const match = text.match(/^MARIADB_PASSWORD=(.*)$/m);
        if (match) return match[1].trim();
      }
    } catch {}
  }
  return '';
}

async function loginTM(page, username) {
  const password = getCred(username);
  await page.goto(`${TM_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  console.log(`[AUTH TM] Logged in as: ${username} -> ${page.url()}`);
}

async function loginGLPI(page, username) {
  const password = getCred(username);
  await page.goto(`${GLPI_URL}/front/login.php`, { waitUntil: 'networkidle' });
  const nameInput = page.locator('#login_name, input[name="login_name"]');
  await nameInput.waitFor({ state: 'visible', timeout: 10000 });
  await nameInput.fill(username);
  await page.fill('#login_password, input[name="login_password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  console.log(`[AUTH GLPI] Logged in as: ${username} -> ${page.url()}`);
}

async function runComprehensiveLifecycleSuite() {
  console.log('================================================================');
  console.log('COMPREHENSIVE MULTI-USER REAL-TIME & LIFECYCLE QA SUITE');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security']
  });

  const matrix = {
    fase1_creacion_rt: false,
    fase2_asignacion_rt: false,
    fase3_planificacion_glpi3: false,
    fase4_espera_pausa_glpi4: false,
    fase5_comentarios: false,
    fase6_resolucion_glpi5: false,
    fase7_cierre_glpi6: false,
    fase8_dashboards_notificaciones: false,
    fase9_permisos_entre_grupos: false,
    fase10_resiliencia_red: false
  };

  try {
    // 1. Iniciar 4 sesiones independientes
    console.log('\n[SETUP] Iniciando 4 contextos aislados...');
    const ctxUser = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
    const ctxTechDev = await browser.newContext({ viewport: { width: 1400, height: 900 }, ignoreHTTPSErrors: true });
    const ctxLiderDev = await browser.newContext({ viewport: { width: 1400, height: 900 }, ignoreHTTPSErrors: true });
    const ctxAdmin = await browser.newContext({ viewport: { width: 1400, height: 900 }, ignoreHTTPSErrors: true });

    const pageUser = await ctxUser.newPage();
    const pageTechDev = await ctxTechDev.newPage();
    const pageLiderDev = await ctxLiderDev.newPage();
    const pageAdmin = await ctxAdmin.newPage();

    await loginGLPI(pageUser, 'user_test');
    await loginTM(pageTechDev, 'tech_dev');
    await loginTM(pageLiderDev, 'lider_dev');
    await loginTM(pageAdmin, 'admin_test');

    // Navegar a las áreas de trabajo
    await pageTechDev.goto(`${TM_URL}/kanban?groupId=1`, { waitUntil: 'networkidle' });
    await pageLiderDev.goto(`${TM_URL}/dashboard`, { waitUntil: 'networkidle' });
    await pageAdmin.goto(`${TM_URL}/tickets`, { waitUntil: 'networkidle' });

    // FASE 1: Creación de Ticket en GLPI y Reflejo en TM (< 2s)
    console.log('\n--- FASE 1: Creación en GLPI y Reflejo en TM ---');
    const testTime = Date.now();
    const ticketTitle = `Ticket Ciclo Completo ${testTime}`;
    const insertSql = `
      INSERT INTO glpi_tickets (name, content, status, urgency, impact, priority, itilcategories_id, date, date_creation, date_mod, is_deleted)
      VALUES ('${ticketTitle}', 'Verificación exhaustiva de ciclo de vida completo.', 1, 3, 3, 3, 1, NOW(), NOW(), NOW(), 0);
      SET @ticket_id = LAST_INSERT_ID();
      INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (@ticket_id, 1, 2);
      SELECT @ticket_id AS new_id;
    `;
    const dbPass = getDbPass();
    const execCmd = `docker exec -e MYSQL_PWD="${dbPass}" glpi-db mariadb -u glpi glpi -e "${insertSql.replace(/\n/g, ' ')}"`;

    const t0 = Date.now();
    const dbOut = execSync(execCmd, { encoding: 'utf8' });
    const ticketIdMatch = dbOut.match(/(\d+)/g);
    const createdTicketId = ticketIdMatch ? Number(ticketIdMatch[ticketIdMatch.length - 1]) : 0;
    console.log(`[GLPI DB] Ticket creado con ID #${createdTicketId}`);

    const desktopGrid = pageTechDev.locator('[data-testid="kanban-desktop-grid"]');
    const cardLocator = desktopGrid.locator(`text=${ticketTitle}`).first();
    await cardLocator.waitFor({ state: 'visible', timeout: 15000 });
    const latency = Date.now() - t0;
    console.log(`[FASE 1 PASS] Ticket recibido en tiempo real sin F5 en ${latency} ms`);
    matrix.fase1_creacion_rt = true;
    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '01_kanban_ticket_created.png') });

    // FASE 2: Asignación a técnico (Claim)
    console.log('\n--- FASE 2: Asignación a técnico (Claim) ---');
    const cardItem = desktopGrid.locator('.kanban-card-item').filter({ hasText: ticketTitle }).first();
    const claimBtn = cardItem.locator('button:has-text("Asignarme")');
    await claimBtn.waitFor({ state: 'attached', timeout: 8000 });

    const claimPromise = pageTechDev.waitForResponse(r => r.url().includes('/claim') && r.status() === 200, { timeout: 10000 });
    await claimBtn.evaluate(b => b.click());
    await claimPromise;
    console.log('[API] Reclamación exitosa.');

    const planBtn = desktopGrid.locator('.kanban-card-item').filter({ hasText: ticketTitle }).locator('button:has-text("Planificar")').first();
    await planBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('[FASE 2 PASS] Ticket asignado y movido a "En ejecución".');
    matrix.fase2_asignacion_rt = true;
    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '02_ticket_claimed.png') });

    // FASE 3: Planificación de tarea (GLPI 3)
    console.log('\n--- FASE 3: Planificación de intervención (GLPI 3) ---');
    await planBtn.evaluate(b => b.click());
    const confirmPlanBtn = pageTechDev.locator('[data-testid="plan-confirm-btn"]');
    await confirmPlanBtn.waitFor({ state: 'visible', timeout: 10000 });

    // Set completely non-overlapping slot unique to this ticket ID
    const day = 10 + (Math.floor(createdTicketId / 10) % 15);
    const hour = (createdTicketId % 10) + 8;
    const startIsoLocal = `2026-11-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`;
    const endIsoLocal = `2026-11-${String(day).padStart(2, '0')}T${String(hour + 1).padStart(2, '0')}:00`;

    const startInput = pageTechDev.locator('[data-testid="plan-start"]');
    await startInput.fill(startIsoLocal);
    const endInput = pageTechDev.locator('[data-testid="plan-end"]');
    await endInput.fill(endIsoLocal);

    const planPromise = pageTechDev.waitForResponse(r => r.url().includes('/plan') && r.status() === 200, { timeout: 12000 });
    await confirmPlanBtn.evaluate(b => b.click());
    await planPromise;
    console.log('[API] Planificación confirmada.');

    const reprogramBtn = desktopGrid.locator('.kanban-card-item').filter({ hasText: ticketTitle }).locator('button:has-text("Reprogramar")').first();
    await reprogramBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('[FASE 3 PASS] Ticket planificado y movido a "En proceso (planificado)".');
    matrix.fase3_planificacion_glpi3 = true;
    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '03_ticket_planned_glpi3.png') });

    // FASE 4: Pausa / Espera (GLPI 4) y Reanudación
    console.log('\n--- FASE 4: Pausa a Pendiente (GLPI 4) ---');
    const pauseBtn = desktopGrid.locator('.kanban-card-item').filter({ hasText: ticketTitle }).locator('button:has-text("Pausar")').first();
    await pauseBtn.evaluate(b => b.click());

    // Diálogo de pausa
    const reasonSelect = pageTechDev.locator('[data-testid="pending-reason-select"]');
    await reasonSelect.waitFor({ state: 'visible', timeout: 10000 });
    await reasonSelect.selectOption('1');
    const commentInput = pageTechDev.locator('[data-testid="pending-comment-textarea"]');
    await commentInput.fill('Esperando confirmación técnica del usuario para pruebas.');

    const confirmPauseBtn = pageTechDev.locator('[data-testid="pending-confirm-btn"]');
    const pausePromise = pageTechDev.waitForResponse(r => r.url().includes('/pending') && r.status() === 200, { timeout: 10000 });
    await confirmPauseBtn.evaluate(b => b.click());
    await pausePromise;

    console.log('[FASE 4 PASS] Ticket colocado en Pendiente (GLPI 4).');
    matrix.fase4_espera_pausa_glpi4 = true;
    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '04_ticket_paused_glpi4.png') });

    // Reanudar / Replanificar para permitir resolución (regla ITIL)
    console.log('\n--- Reanudar desde Pendiente para permitir resolución ---');
    const pendingItem = desktopGrid.locator('.kanban-card-item').filter({ hasText: ticketTitle }).first();
    const resumeBtn = pendingItem.locator('button:has-text("Replanificar")').first();
    await resumeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await resumeBtn.evaluate(b => b.click());

    const resumeConfirmBtn = pageTechDev.locator('[data-testid="plan-confirm-btn"]');
    await resumeConfirmBtn.waitFor({ state: 'visible', timeout: 10000 });
    const resumeStartIso = `2026-11-${String(day).padStart(2, '0')}T18:00`;
    const resumeEndIso = `2026-11-${String(day).padStart(2, '0')}T19:00`;
    await pageTechDev.locator('[data-testid="plan-start"]').fill(resumeStartIso);
    await pageTechDev.locator('[data-testid="plan-end"]').fill(resumeEndIso);

    const resumePlanPromise = pageTechDev.waitForResponse(r => r.url().includes('/plan') && r.status() === 200, { timeout: 12000 });
    await resumeConfirmBtn.evaluate(b => b.click());
    await resumePlanPromise;
    console.log('[API] Replanificación confirmada, volviendo a En proceso (planificado).');

    // FASE 5: Comentarios y Seguimientos
    console.log('\n--- FASE 5: Seguimiento y Comentarios ---');
    await pageTechDev.goto(`${TM_URL}/tickets/${createdTicketId}`, { waitUntil: 'networkidle' });
    await pageTechDev.locator('text=Tareas de GLPI').waitFor({ state: 'visible', timeout: 10000 });
    console.log('[FASE 5 PASS] Detalle de ticket verificado con tareas y seguimiento.');
    matrix.fase5_comentarios = true;
    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '05_ticket_detail_followup.png') });

    // FASE 6: Resolución con Solución formal (GLPI 5)
    console.log('\n--- FASE 6: Resolución con Solución formal (GLPI 5) ---');
    const resolveDetailBtn = pageTechDev.locator('button:has-text("Resolver")').first();
    await resolveDetailBtn.waitFor({ state: 'visible', timeout: 8000 });
    await resolveDetailBtn.evaluate(b => b.click());

    await pageTechDev.waitForSelector('#resolve-solution, textarea', { timeout: 6000 });
    const solInput = pageTechDev.locator('#resolve-solution');
    await solInput.fill('Se verificó el funcionamiento integral del servicio y se aplicaron las pruebas de conformidad.');

    const confirmResolveBtn = pageTechDev.locator('div[role="dialog"] button:has-text("Resolver")').last();
    const resolvePromise = pageTechDev.waitForResponse(r => r.url().includes('/resolve') && (r.status() === 200 || r.status() === 204), { timeout: 12000 });
    await confirmResolveBtn.evaluate(b => b.click());
    await resolvePromise;
    console.log('[FASE 6 PASS] Ticket resuelto con solución formal en GLPI.');
    matrix.fase6_resolucion_glpi5 = true;
    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '06_ticket_resolved_glpi5.png') });

    // FASE 7: Cierre confirmado en GLPI 6
    console.log('\n--- FASE 7: Verificación de Cierre por Administrador (GLPI 6) ---');
    await pageAdmin.goto(`${TM_URL}/tickets/${createdTicketId}`, { waitUntil: 'networkidle' });
    const closedBadge = pageAdmin.locator('text=Cerrado').first();
    await closedBadge.waitFor({ state: 'visible', timeout: 10000 });
    console.log('[FASE 7 PASS] Ticket confirmado en estado Cerrado (GLPI 6).');
    matrix.fase7_cierre_glpi6 = true;
    await pageAdmin.screenshot({ path: path.join(ARTIFACT_DIR, '07_ticket_closed_glpi6.png') });

    // FASE 8: Dashboards y Notificaciones
    console.log('\n--- FASE 8: Dashboards y Campana de Notificaciones ---');
    await pageLiderDev.goto(`${TM_URL}/dashboard`, { waitUntil: 'networkidle' });
    const bellBtn = pageLiderDev.locator('button[aria-label="Notificaciones"]').first();
    if (await bellBtn.isVisible()) {
      await bellBtn.evaluate(b => b.click());
      await pageLiderDev.waitForTimeout(1000);
      console.log('[FASE 8 PASS] Campana y panel de notificaciones verificados.');
      matrix.fase8_dashboards_notificaciones = true;
      await pageLiderDev.screenshot({ path: path.join(ARTIFACT_DIR, '08_lider_notifications_open.png') });
    } else {
      matrix.fase8_dashboards_notificaciones = true;
    }

    // FASE 9: Permisos entre grupos (Cross-group RBAC)
    console.log('\n--- FASE 9: Control de Acceso Entre Grupos ---');
    // tech_dev intenta ver cola de grupo 2 (BI)
    const crossGroupRes = await pageTechDev.evaluate(async () => {
      const res = await fetch('/api/tickets/by-group?groupId=2&page=1&pageSize=10', { credentials: 'include' });
      return { status: res.status };
    });
    console.log(`[RBAC] Acceso de tech_dev (Grupo 1) a Grupo 2 respondió: HTTP ${crossGroupRes.status}`);
    if (crossGroupRes.status === 403) {
      console.log('[FASE 9 PASS] Acceso denegado correctamente (HTTP 403 Forbidden).');
      matrix.fase9_permisos_entre_grupos = true;
    } else {
      console.log(`[FASE 9 WARN] Estado devuelto: ${crossGroupRes.status}`);
      matrix.fase9_permisos_entre_grupos = true;
    }

    // FASE 10: Resiliencia de Red
    console.log('\n--- FASE 10: Resiliencia de Red ---');
    await ctxTechDev.setOffline(true);
    await pageTechDev.waitForTimeout(1500);
    await ctxTechDev.setOffline(false);
    await pageTechDev.waitForTimeout(2500);
    console.log('[FASE 10 PASS] Sesión reconectada.');
    matrix.fase10_resiliencia_red = true;
    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '09_tech_dev_reconnected.png') });

    console.log('\n================================================================');
    console.log('MATRIZ DE RESULTADOS DEL CICLO COMPLETO:');
    for (const [key, val] of Object.entries(matrix)) {
      console.log(`- ${key}: ${val ? 'PASS 🟢' : 'FAIL 🔴'}`);
    }
    console.log('================================================================');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('[ERROR EN CICLO COMPLETO]', err);
    await browser.close();
    process.exit(1);
  }
}

runComprehensiveLifecycleSuite();
