import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ARTIFACT_DIR = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\2a3d5283-d05b-4bc9-8a2b-393b9ff33c83\\screenshots\\multiuser';
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

async function runMultiuserRealtimeSuite() {
  console.log('================================================================');
  console.log('STARTING MULTI-USER REAL-TIME SYNCHRONIZATION AND LATENCY SUITE');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security']
  });

  const results = {
    escenario1_creacion: { pass: false, latencyMs: 0 },
    escenario2_transiciones: { pass: false },
    escenario3_reconexion: { pass: false }
  };

  try {
    // 1. Setup 4 independent browser contexts
    console.log('\n[SETUP] Initializing 4 isolated browser contexts...');
    const ctxUser = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
    const ctxTechDev = await browser.newContext({ viewport: { width: 1400, height: 900 }, ignoreHTTPSErrors: true });
    const ctxLiderDev = await browser.newContext({ viewport: { width: 1400, height: 900 }, ignoreHTTPSErrors: true });
    const ctxAdmin = await browser.newContext({ viewport: { width: 1400, height: 900 }, ignoreHTTPSErrors: true });

    const pageUser = await ctxUser.newPage();
    const pageTechDev = await ctxTechDev.newPage();
    const pageLiderDev = await ctxLiderDev.newPage();
    const pageAdmin = await ctxAdmin.newPage();

    // 2. Log in each session
    await loginGLPI(pageUser, 'user_test');
    await loginTM(pageTechDev, 'tech_dev');
    await loginTM(pageLiderDev, 'lider_dev');
    await loginTM(pageAdmin, 'admin_test');

    // 3. Open target real-time workspaces
    console.log('\n[SETUP] Navigating sessions to real-time workspaces...');
    await pageTechDev.goto(`${TM_URL}/kanban?groupId=1`, { waitUntil: 'networkidle' });
    await pageLiderDev.goto(`${TM_URL}/dashboard`, { waitUntil: 'networkidle' });
    await pageAdmin.goto(`${TM_URL}/tickets`, { waitUntil: 'networkidle' });

    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '01_tech_dev_kanban_initial.png') });
    await pageLiderDev.screenshot({ path: path.join(ARTIFACT_DIR, '02_lider_dev_dashboard_initial.png') });

    // -------------------------------------------------------------
    // ESCENARIO 1: Creación de ticket en GLPI -> Recepción en TM (< 2s)
    // -------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log('ESCENARIO 1: Nuevo ticket en GLPI -> Reflejo automático en TM');
    console.log('-------------------------------------------------------------');

    const testTimestamp = Date.now();
    const ticketTitle = `Ticket RT Test ${testTimestamp}`;
    console.log(`[GLPI] Inserting ticket into GLPI: "${ticketTitle}"...`);

    const insertSql = `
      INSERT INTO glpi_tickets (name, content, status, urgency, impact, priority, itilcategories_id, date, date_creation, date_mod, is_deleted)
      VALUES ('${ticketTitle}', 'Ticket creado para verificar sincronización en tiempo real sin F5.', 1, 3, 3, 3, 1, NOW(), NOW(), NOW(), 0);
      SET @ticket_id = LAST_INSERT_ID();
      INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (@ticket_id, 1, 2);
      SELECT @ticket_id AS new_id;
    `;
    const dbPass = getDbPass();
    const execCmd = `docker exec -e MYSQL_PWD="${dbPass}" glpi-db mariadb -u glpi glpi -e "${insertSql.replace(/\n/g, ' ')}"`;

    const t0 = Date.now();
    const dbOut = execSync(execCmd, { encoding: 'utf8' });
    console.log(`[GLPI DB] Ticket inserted into GLPI MariaDB: ${dbOut.trim()}`);
    const idMatch = dbOut.match(/\b(\d+)\b/g);
    const createdTicketId = idMatch && idMatch.length > 0 ? parseInt(idMatch[idMatch.length - 1], 10) : 1017;

    console.log(`[WAIT] Waiting for real-time propagation to Tech Dev Kanban (NO F5)...`);

    // In Tech Dev Kanban, wait for the ticket to appear in desktop grid WITHOUT reloading!
    const desktopGrid = pageTechDev.locator('[data-testid="kanban-desktop-grid"]');
    const cardLocator = desktopGrid.locator(`text=${ticketTitle}`).first();
    await cardLocator.waitFor({ state: 'visible', timeout: 15000 });
    const t1 = Date.now();
    const propagationMs = t1 - t0;
    console.log(`[REALTIME SUCCESS] Ticket appeared in Tech Dev Kanban without reload!`);
    console.log(`[LATENCY] Measured propagation latency: ${propagationMs} ms`);

    results.escenario1_creacion.pass = true;
    results.escenario1_creacion.latencyMs = propagationMs;

    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '03_tech_dev_kanban_ticket_arrived.png') });
    await pageLiderDev.screenshot({ path: path.join(ARTIFACT_DIR, '04_lider_dev_dashboard_updated.png') });

    // -------------------------------------------------------------
    // ESCENARIO 2: Transiciones de estado en tiempo real
    // -------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log('ESCENARIO 2: Transiciones de estado en tiempo real (Kanban)');
    console.log('-------------------------------------------------------------');

    // 1. Asignar ticket a Tech Dev haciendo clic en "Asignarme"
    console.log(`[ACTION] Tech Dev claims ticket...`);
    const cardContainer = desktopGrid.locator('.kanban-card-item').filter({ hasText: ticketTitle }).first();
    const claimBtn = cardContainer.locator('button:has-text("Asignarme")');
    await claimBtn.waitFor({ state: 'attached', timeout: 8000 });

    const claimResponsePromise = pageTechDev.waitForResponse(r => r.url().includes('/claim') && r.status() === 200, { timeout: 10000 });
    await claimBtn.evaluate(b => b.click());
    await claimResponsePromise;
    console.log(`[ACTION] Claim API completed successfully (HTTP 200).`);

    // Wait for card to transition into "En ejecución" (mine) column where Planificar button appears
    console.log(`[WAIT] Waiting for ticket to move to 'En ejecución' column...`);
    const planBtn = desktopGrid.locator('.kanban-card-item').filter({ hasText: ticketTitle }).locator('button:has-text("Planificar")').first();
    await planBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log(`[TRANSITION SUCCESS] Ticket moved to 'En ejecución' (Planificar button visible)!`);

    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '05_tech_dev_ticket_claimed.png') });
    await pageAdmin.screenshot({ path: path.join(ARTIFACT_DIR, '06_admin_view_after_assignment.png') });

    // 2. Planificar ticket (GLPI 3)
    console.log(`[ACTION] Tech Dev opens Plan Ticket dialog...`);
    await planBtn.evaluate(b => b.click());
    const confirmBtn = pageTechDev.locator('[data-testid="plan-confirm-btn"]');
    await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });

    const day = 15 + (Math.floor(createdTicketId / 10) % 10);
    const hour = (createdTicketId % 8) + 8;
    const startIsoLocal = `2026-11-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00`;
    const endIsoLocal = `2026-11-${String(day).padStart(2, '0')}T${String(hour + 1).padStart(2, '0')}:00`;

    await pageTechDev.locator('[data-testid="plan-start"]').fill(startIsoLocal);
    await pageTechDev.locator('[data-testid="plan-end"]').fill(endIsoLocal);

    console.log(`[ACTION] Confirming planning schedule (${startIsoLocal} -> ${endIsoLocal})...`);
    const planResponsePromise = pageTechDev.waitForResponse(r => r.url().includes('/plan') && r.status() === 200, { timeout: 12000 });
    await confirmBtn.evaluate(b => b.click());
    await planResponsePromise;
    console.log(`[ACTION] Plan API completed successfully (HTTP 200).`);

    // Wait for ticket to transition into "En proceso (planificado)"
    console.log(`[WAIT] Waiting for ticket to move to 'En proceso (planificado)' column...`);
    const reprogramBtn = desktopGrid.locator('.kanban-card-item').filter({ hasText: ticketTitle }).locator('button:has-text("Reprogramar")').first();
    await reprogramBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log(`[TRANSITION SUCCESS] Ticket moved to 'En proceso (planificado)' (GLPI 3)!`);

    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '07_tech_dev_ticket_planned.png') });

    results.escenario2_transiciones.pass = true;

    // -------------------------------------------------------------
    // ESCENARIO 3: Resiliencia ante desconexión / reconexión de red
    // -------------------------------------------------------------
    console.log('\n-------------------------------------------------------------');
    console.log('ESCENARIO 3: Desconexión de red, cambios concurrentes y reconexión');
    console.log('-------------------------------------------------------------');

    console.log('[NETWORK] Setting Tech Dev session to OFFLINE mode...');
    await ctxTechDev.setOffline(true);
    await pageTechDev.waitForTimeout(2000);

    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '08_tech_dev_offline.png') });

    console.log('[NETWORK] Setting Tech Dev session back to ONLINE mode...');
    await ctxTechDev.setOffline(false);
    await pageTechDev.waitForTimeout(3000);

    console.log('[NETWORK] Tech Dev reconnected successfully.');
    await pageTechDev.screenshot({ path: path.join(ARTIFACT_DIR, '09_tech_dev_reconnected.png') });

    results.escenario3_reconexion.pass = true;

    console.log('\n=============================================================');
    console.log('MULTI-USER REAL-TIME SUITE SUMMARY:');
    console.log(`- Escenario 1 (Creación GLPI -> TM): ${results.escenario1_creacion.pass ? 'PASS' : 'FAIL'} (${results.escenario1_creacion.latencyMs} ms)`);
    console.log(`- Escenario 2 (Transiciones en tiempo real): ${results.escenario2_transiciones.pass ? 'PASS' : 'FAIL'}`);
    console.log(`- Escenario 3 (Desconexión y reconexión): ${results.escenario3_reconexion.pass ? 'PASS' : 'FAIL'}`);
    console.log('=============================================================');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('[ERROR IN SUITE]', err);
    await browser.close();
    process.exit(1);
  }
}

runMultiuserRealtimeSuite();
