import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => {
    console.log('PAGE ERROR NAME:', err.name);
    console.log('PAGE ERROR MSG:', err.message);
    console.log('PAGE ERROR STACK:', err.stack);
    if (err.issues) console.log('ZOD ISSUES:', JSON.stringify(err.issues, null, 2));
  });
  await page.goto('http://localhost:5173/login');
  await page.fill('input[name="username"]', 'tech_dev');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.pathname.includes('/login'));
  console.log('Navigated to:', page.url());
  await page.waitForTimeout(4000);
  const auth = await page.evaluate(() => localStorage.getItem('glpi-ticket-manager.auth'));
  console.log('Auth in localStorage:', auth);
  const debugHub = await page.evaluate(() => {
    return {
      pathname: window.location.pathname,
      hub: window.__debug_hub ?? null
    };
  });
  console.log('Debug Hub:', debugHub);
  const elements = await page.$$('[data-testid="connection-indicator"]');
  console.log('Count of connection-indicator:', elements.length);
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const state = await el.getAttribute('data-state');
    const isVisible = await el.isVisible();
    console.log(`Indicator ${i}: state=${state}, isVisible=${isVisible}`);
  }
  await browser.close();
}

main().catch(console.error);
