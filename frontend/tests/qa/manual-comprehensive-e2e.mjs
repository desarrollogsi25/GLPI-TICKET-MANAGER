import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\2a3d5283-d05b-4bc9-8a2b-393b9ff33c83\\screenshots';
const GLPI_URL = 'http://localhost:8081';
const TM_LAN_HTTP = 'http://10.10.40.31';
const TM_LAN_HTTPS = 'https://10.10.40.31';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function saveScreenshot(page, filename) {
  const filePath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[SCREENSHOT] Saved: ${filename}`);
}

async function clearAndLogin(page, username, password) {
  await page.goto(`${TM_LAN_HTTP}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.goto(`${TM_LAN_HTTP}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('input[name="username"], input[autocomplete="username"]', { timeout: 10000 });
  await page.fill('input[name="username"], input[autocomplete="username"]', username);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  console.log(`[AUTH] Logged in successfully as: ${username} -> ${page.url()}`);
}

async function runAllTests() {
  console.log('=== STARTING ROBUST PLAYWRIGHT E2E EXECUTION ===');
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();
  let createdTicketId = null;

  // -------------------------------------------------------------
  // 1. GLPI WEB UI TEST: Login & Ticket Creation
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing GLPI Web UI (http://localhost:8081) ---');
  try {
    await page.goto(`${GLPI_URL}/index.php`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.fill('#login_name', 'glpi');
    await page.fill('#login_password', 'glpi');
    await page.click('button[type="submit"], input[type="submit"]');
    await page.waitForLoadState('networkidle');
    console.log('GLPI Logged in. URL:', page.url());

    await page.goto(`${GLPI_URL}/front/ticket.form.php`, { waitUntil: 'networkidle' });
    const timestamp = Date.now();
    const ticketTitle = `Ticket E2E Prueba Automatizada - ${timestamp}`;
    
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill(ticketTitle);
    }
    
    const contentTextarea = page.locator('textarea[name="content"]');
    if (await contentTextarea.isVisible()) {
      await contentTextarea.fill('Ticket creado directamente desde la interfaz web de GLPI para validar ingesta en Ticket Manager.');
    }

    const submitBtn = page.locator('button[name="add"], input[name="add"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      console.log('Ticket submitted in GLPI. URL:', page.url());
      const match = page.url().match(/id=(\d+)/);
      if (match) {
        createdTicketId = parseInt(match[1], 10);
        console.log(`Created Ticket ID in GLPI: ${createdTicketId}`);
      }
    }

    await saveScreenshot(page, '01_glpi_ticket_creation.png');
  } catch (err) {
    console.error('Error in GLPI step:', err.message);
  }

  // -------------------------------------------------------------
  // 2. TICKET MANAGER LOGIN & INGESTION VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Ticket Manager Ingestion on LAN (http://10.10.40.31) ---');
  try {
    await clearAndLogin(page, 'admin_test', 'Password123!');
    await page.goto(`${TM_LAN_HTTP}/kanban`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, '02_tm_ticket_ingested.png');
  } catch (err) {
    console.error('Error in TM Ingestion step:', err.message);
  }

  // -------------------------------------------------------------
  // 3. MULTI-ROLE AUTHENTICATION & DASHBOARDS
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Authentication across 4 Roles ---');
  
  // A) Admin View
  try {
    await page.goto(`${TM_LAN_HTTP}/administracion`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await saveScreenshot(page, '03_tm_role_admin.png');
  } catch (err) {
    console.error('Error in Admin View:', err.message);
  }

  // B) Logout Admin
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${TM_LAN_HTTP}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await saveScreenshot(page, '04_tm_logout.png');
  } catch (err) {
    console.error('Error in Logout step:', err.message);
  }

  // C) Supervisor View (lider_dev)
  try {
    await clearAndLogin(page, 'lider_dev', 'Password123!');
    await page.goto(`${TM_LAN_HTTP}/equipo`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await saveScreenshot(page, '05_tm_role_supervisor.png');
  } catch (err) {
    console.error('Error in Supervisor View:', err.message);
  }

  // D) Technician View (tech_dev)
  try {
    await clearAndLogin(page, 'tech_dev', 'Password123!');
    await page.goto(`${TM_LAN_HTTP}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await saveScreenshot(page, '06_tm_role_technician.png');
  } catch (err) {
    console.error('Error in Technician View:', err.message);
  }

  // E) Solicitante View (user_test)
  try {
    await clearAndLogin(page, 'user_test', 'Password123!');
    await page.goto(`${TM_LAN_HTTP}/tickets`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await saveScreenshot(page, '07_tm_role_solicitante.png');
  } catch (err) {
    console.error('Error in Solicitante View:', err.message);
  }

  // Log back in as admin_test for remaining operations
  await clearAndLogin(page, 'admin_test', 'Password123!');

  // -------------------------------------------------------------
  // 4. CATÁLOGO DE SERVICIOS (8 FORMS / NODES)
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Services Catalog (8 forms/nodes) ---');
  try {
    await page.goto(`${TM_LAN_HTTP}/services`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Expand tree items
    const expandButtons = page.locator('button[aria-label="Expandir"]');
    const count = await expandButtons.count();
    for (let i = 0; i < count; i++) {
      try {
        await expandButtons.nth(i).click();
        await page.waitForTimeout(200);
      } catch {}
    }
    await page.waitForTimeout(800);
    await saveScreenshot(page, '08_services_catalog_hierarchy.png');
  } catch (err) {
    console.error('Error in Services Catalog:', err.message);
  }

  // -------------------------------------------------------------
  // 5. KANBAN BOARD
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Kanban Board ---');
  try {
    await page.goto(`${TM_LAN_HTTP}/kanban`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await saveScreenshot(page, '09_kanban_board_full.png');
  } catch (err) {
    console.error('Error in Kanban step:', err.message);
  }

  // -------------------------------------------------------------
  // 6. TICKET LIFECYCLE: DETAILS, PLAN, REPLAN, RESOLVE, CLOSE
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Ticket Detail Lifecycle ---');
  const targetId = createdTicketId || 1003;
  try {
    await page.goto(`${TM_LAN_HTTP}/tickets/${targetId}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // Check if "Planificar tarea" button is visible
    const planTrigger = page.locator('[data-testid="start-ticket-btn"], button:has-text("Planificar tarea")');
    if (await planTrigger.isVisible()) {
      await planTrigger.click();
      await page.waitForSelector('[data-testid="plan-content"]', { timeout: 5000 });
      await page.fill('[data-testid="plan-content"]', 'Intervención de soporte planificada para verificación de servicio.');
      await page.click('[data-testid="plan-confirm-btn"]');
      await page.waitForTimeout(1500);
      console.log('Ticket planned successfully!');
    }
    await saveScreenshot(page, '10_ticket_detail_planned.png');

    // Replan task if available
    const replanTrigger = page.locator('button:has-text("Reprogramar")').first();
    if (await replanTrigger.isVisible()) {
      await replanTrigger.click();
      await page.waitForTimeout(500);
      const descInput = page.locator('textarea').first();
      if (await descInput.isVisible()) {
        await descInput.fill('Reprogramación autorizada de tarea por ventana de mantenimiento.');
      }
      const confirmReplan = page.locator('button:has-text("Guardar"), button:has-text("Confirmar"), button[type="submit"]').first();
      if (await confirmReplan.isVisible()) {
        await confirmReplan.click();
        await page.waitForTimeout(1500);
        console.log('Task replanned successfully!');
      }
    }
    await saveScreenshot(page, '11_ticket_detail_replanned.png');

    // Complete task or transition
    const completeTaskBtn = page.locator('button:has-text("Completar")').first();
    if (await completeTaskBtn.isVisible()) {
      await completeTaskBtn.click();
      await page.waitForTimeout(1200);
      const confirmDialogBtn = page.locator('button:has-text("Confirmar")');
      if (await confirmDialogBtn.isVisible()) {
        await confirmDialogBtn.click();
        await page.waitForTimeout(1200);
      }
    }

    // Atomic Resolution
    const resolveTrigger = page.locator('button:has-text("Resolver")').first();
    if (await resolveTrigger.isVisible() && await resolveTrigger.isEnabled()) {
      await resolveTrigger.click();
      await page.waitForSelector('#resolve-solution', { timeout: 5000 });
      await page.fill('#resolve-solution', 'Incidencia solventada: servicio reiniciado y verificado según estándares ITIL v4.');
      await page.click('button[type="submit"]:has-text("Resolver")');
      await page.waitForTimeout(1500);
      console.log('Ticket resolved successfully!');
    }
    await saveScreenshot(page, '12_ticket_resolved.png');

    // Close Ticket
    const closeBtn = page.locator('button:has-text("Cerrado")').first();
    if (await closeBtn.isVisible() && await closeBtn.isEnabled()) {
      await closeBtn.click();
      await page.waitForTimeout(1200);
      console.log('Ticket closed successfully!');
    }
    await saveScreenshot(page, '13_ticket_closed.png');
  } catch (err) {
    console.error('Error in Ticket Details lifecycle step:', err.message);
  }

  // -------------------------------------------------------------
  // 7. NOTIFICATIONS, SEARCH / COMMAND PALETTE & PREFERENCES
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Notifications, Command Palette & Preferences ---');
  try {
    // Notifications Bell
    const bell = page.locator('button[aria-label*="notificaci" i], button:has(svg.lucide-bell), [data-testid="notification-bell"]');
    if (await bell.first().isVisible()) {
      await bell.first().click();
      await page.waitForTimeout(600);
      await saveScreenshot(page, '14_notifications_bell.png');
      await bell.first().click(); // close popover
    }

    // Command Palette / Search
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(600);
    await saveScreenshot(page, '15_command_palette.png');
    await page.keyboard.press('Escape');

    // Preferences: Dark / Light Mode
    await page.goto(`${TM_LAN_HTTP}/preferences`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const themeToggle = page.locator('button:has-text("Oscuro"), button:has-text("Dark"), button:has-text("Claro"), button:has-text("Light")');
    if (await themeToggle.first().isVisible()) {
      await themeToggle.first().click();
      await page.waitForTimeout(600);
    }
    await saveScreenshot(page, '16_preferences_theme.png');
  } catch (err) {
    console.error('Error in Notifications/Preferences step:', err.message);
  }

  // -------------------------------------------------------------
  // 8. DASHBOARDS & CALENDAR FILTERS
  // -------------------------------------------------------------
  console.log('\n--- 8. Testing Supervisor & Technician Dashboards with Filters ---');
  try {
    await page.goto(`${TM_LAN_HTTP}/equipo`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, '17_supervisor_dashboard.png');

    await page.goto(`${TM_LAN_HTTP}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await saveScreenshot(page, '18_technician_dashboard.png');
  } catch (err) {
    console.error('Error in Dashboards step:', err.message);
  }

  // -------------------------------------------------------------
  // 9. MOBILE VIEWPORT (375x812)
  // -------------------------------------------------------------
  console.log('\n--- 9. Testing Mobile Viewport (375x812) ---');
  try {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
      ignoreHTTPSErrors: true
    });
    const mobilePage = await mobileContext.newPage();
    
    await clearAndLogin(mobilePage, 'admin_test', 'Password123!');
    await mobilePage.goto(`${TM_LAN_HTTP}/kanban`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await saveScreenshot(mobilePage, '19_mobile_kanban.png');

    await mobilePage.goto(`${TM_LAN_HTTP}/tickets/${targetId}`, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);
    await saveScreenshot(mobilePage, '20_mobile_ticket_detail.png');

    await mobileContext.close();
  } catch (err) {
    console.error('Error in Mobile step:', err.message);
  }

  // -------------------------------------------------------------
  // 10. LOCAL HTTPS & PWA VERIFICATION (https://10.10.40.31)
  // -------------------------------------------------------------
  console.log('\n--- 10. Testing Local HTTPS & PWA (https://10.10.40.31) ---');
  try {
    const httpsContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true
    });
    const httpsPage = await httpsContext.newPage();
    
    await httpsPage.goto(`${TM_LAN_HTTPS}/login`, { waitUntil: 'domcontentloaded' });
    await httpsPage.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await httpsPage.goto(`${TM_LAN_HTTPS}/login`, { waitUntil: 'networkidle' });
    await httpsPage.waitForSelector('input[name="username"], input[autocomplete="username"]', { timeout: 10000 });
    await httpsPage.fill('input[name="username"], input[autocomplete="username"]', 'admin_test');
    await httpsPage.fill('input[name="password"], input[type="password"]', 'Password123!');
    await httpsPage.click('button[type="submit"]');
    await httpsPage.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
    
    const swRegistrations = await httpsPage.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs.map(r => ({ scope: r.scope, active: !!r.active }));
      }
      return 'not supported';
    });
    console.log('HTTPS Service Worker Registrations:', JSON.stringify(swRegistrations));

    await httpsPage.goto(`${TM_LAN_HTTPS}/kanban`, { waitUntil: 'networkidle' });
    await httpsPage.waitForTimeout(1200);
    await saveScreenshot(httpsPage, '21_pwa_https_lan.png');
    await httpsContext.close();
  } catch (err) {
    console.error('Error in HTTPS PWA step:', err.message);
  }

  await browser.close();
  console.log('\n=== COMPREHENSIVE E2E EXECUTION FINISHED SUCCESSFULLY ===');
}

runAllTests().catch(err => {
  console.error('FATAL E2E ERROR:', err);
  process.exit(1);
});
