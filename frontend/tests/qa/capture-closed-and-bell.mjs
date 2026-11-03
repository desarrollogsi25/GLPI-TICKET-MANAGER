import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\2a3d5283-d05b-4bc9-8a2b-393b9ff33c83\\screenshots';
const TM_LAN_HTTP = 'http://10.10.40.31';

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

async function captureBell() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  // Login
  await page.goto(`${TM_LAN_HTTP}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto(`${TM_LAN_HTTP}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', 'admin_test');
  await page.fill('input[name="password"], input[type="password"]', getCred('admin_test'));
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  await page.goto(`${TM_LAN_HTTP}/kanban`, { waitUntil: 'networkidle' });

  console.log('Finding notification bell...');
  const bell = page.locator('button[aria-label="Notificaciones"]:visible').first();
  await bell.waitFor({ state: 'visible', timeout: 10000 });
  await bell.click();
  await page.waitForTimeout(600);

  const p14 = path.join(ARTIFACT_DIR, '14_notifications_bell.png');
  await page.screenshot({ path: p14 });
  console.log('Saved 14_notifications_bell.png');

  // Close bell
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 15. Command Palette
  console.log('Opening command palette...');
  await page.keyboard.press('Control+k');
  await page.waitForTimeout(600);
  const p15 = path.join(ARTIFACT_DIR, '15_command_palette.png');
  await page.screenshot({ path: p15 });
  console.log('Saved 15_command_palette.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 16. Preferences Theme
  console.log('Opening preferences / theme...');
  const userMenu = page.locator('button[aria-label*="perfil"], button[aria-label*="usuario"], button:has(svg.lucide-user)').first();
  if (await userMenu.isVisible()) {
    await userMenu.click();
    await page.waitForTimeout(300);
  }
  const prefBtn = page.locator('button:has-text("Preferencias"), [role="menuitem"]:has-text("Preferencias")').first();
  if (await prefBtn.isVisible()) {
    await prefBtn.click();
    await page.waitForTimeout(500);
  }
  const p16 = path.join(ARTIFACT_DIR, '16_preferences_theme.png');
  await page.screenshot({ path: p16 });
  console.log('Saved 16_preferences_theme.png');

  // 13. Ticket Closed
  console.log('Viewing closed ticket in kanban...');
  await page.goto(`${TM_LAN_HTTP}/kanban`, { waitUntil: 'networkidle' });
  const closedCard = page.locator('div[data-status="6"], div:has-text("Cerrado")').first();
  if (await closedCard.isVisible()) {
    await closedCard.click();
    await page.waitForTimeout(600);
  }
  const p13 = path.join(ARTIFACT_DIR, '13_ticket_closed.png');
  await page.screenshot({ path: p13 });
  console.log('Saved 13_ticket_closed.png');

  await browser.close();
}

captureBell().catch(console.error);
