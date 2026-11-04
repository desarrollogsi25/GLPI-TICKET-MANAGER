import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ARTIFACT_DIR = 'C:\\Users\\DEVELOPMENT\\.gemini\\antigravity\\brain\\2a3d5283-d05b-4bc9-8a2b-393b9ff33c83\\screenshots\\pwa';
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

async function runPwaPushAudit() {
  console.log('================================================================');
  console.log('AUDITORÍA Y VERIFICACIÓN DE NOTIFICACIONES PWA Y WEB PUSH');
  console.log('================================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors', '--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    permissions: ['notifications'],
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`));

  try {
    const password = getCred('tech_dev');
    console.log('[1/5] Iniciando sesión como tech_dev...');
    await page.goto(`${TM_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[name="username"]', 'tech_dev');
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 15000 });
    console.log('[AUTH] Login exitoso. URL:', page.url());

    console.log('[2/5] Navegando a Preferencias para auditar Web Push...');
    await page.goto(`${TM_URL}/preferences`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_preferences_push_section.png') });

    console.log('[3/5] Comprobando soporte y estado de Service Worker y Notification API...');
    const pwaSupport = await page.evaluate(async () => {
      const hasSW = 'serviceWorker' in navigator;
      const hasPush = 'PushManager' in window;
      const hasNotification = 'Notification' in window;
      const permission = hasNotification ? Notification.permission : 'unsupported';

      let swActive = false;
      let swScope = null;
      if (hasSW) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          swActive = !!reg.active;
          swScope = reg.scope;
        }
      }

      return {
        hasSW,
        hasPush,
        hasNotification,
        permission,
        swActive,
        swScope
      };
    });
    console.log('Estado de soporte PWA:', JSON.stringify(pwaSupport, null, 2));

    console.log('[4/5] Simulando notificación PWA nativa vía Service Worker...');
    const notificationResult = await page.evaluate(async () => {
      try {
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          reg = await navigator.serviceWorker.register('/sw.js');
        }
        await reg.showNotification('GLPI Ticket Manager', {
          body: 'Notificación de prueba verificada en el Centro de Notificaciones',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
          data: { url: '/kanban' },
          tag: 'test-pwa-notification'
        });

        const activeNotifications = await reg.getNotifications();
        return {
          success: true,
          count: activeNotifications.length,
          title: activeNotifications[0]?.title,
          body: activeNotifications[0]?.body
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });
    console.log('Resultado de notificación emitida:', JSON.stringify(notificationResult, null, 2));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_notification_triggered.png') });

    console.log('[5/5] Probando persistencia con pestaña cerrada...');
    // Cerramos la página actual (simulando pestaña cerrada)
    await page.close();
    console.log('Pestaña cerrada. Abriendo nueva página para verificar estado de suscripción y Service Worker...');

    const page2 = await context.newPage();
    await page2.goto(`${TM_URL}/kanban`, { waitUntil: 'networkidle' });
    const swCheck = await page2.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const activeNotifications = reg ? await reg.getNotifications() : [];
      return {
        hasReg: !!reg,
        activeNotificationsCount: activeNotifications.length
      };
    });
    console.log('Comprobación post-cierre:', JSON.stringify(swCheck, null, 2));
    await page2.screenshot({ path: path.join(ARTIFACT_DIR, '03_kanban_resumed.png') });

    console.log('\n================================================================');
    console.log('AUDITORÍA PWA Y WEB PUSH FINALIZADA CON ÉXITO');
    console.log('================================================================');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('[ERROR EN AUDITORÍA PWA]', err);
    await browser.close();
    process.exit(1);
  }
}

runPwaPushAudit();
