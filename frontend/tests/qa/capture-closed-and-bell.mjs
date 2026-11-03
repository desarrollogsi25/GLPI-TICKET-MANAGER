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

  await browser.close();
}

captureBell().catch(console.error);
