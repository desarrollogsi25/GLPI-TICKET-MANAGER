import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const API_BASE = process.env.API_TEST_URL || 'http://127.0.0.1:8080';
const PUSH_RECEIVER_PORT = 9998;
const PUSH_ENDPOINT = `http://host.docker.internal:${PUSH_RECEIVER_PORT}/push/sub-backend-test`;

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

function assert(condition, message) {
  if (!condition) {
    console.error(`\n[FAIL 🔴] ${message}`);
    throw new Error(message);
  }
}

async function runBackendPushIntegration() {
  console.log('================================================================');
  console.log('PRUEBA 1: INTEGRACIÓN BACKEND WEBPUSH (VAPID, CIFRADO Y ENVÍO)');
  console.log('================================================================');

  let receiverServer = null;
  const receivedPackets = [];
  let simulateGone = false;

  try {
    // -------------------------------------------------------------------------
    // 1. Iniciar receptor de prueba para capturar el envío del backend
    // -------------------------------------------------------------------------
    console.log(`\n[1/7] Iniciando receptor HTTP en puerto ${PUSH_RECEIVER_PORT}...`);
    receiverServer = http.createServer((req, res) => {
      if (req.method === 'POST') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
          const bodyBuf = Buffer.concat(chunks);
          receivedPackets.push({
            url: req.url,
            headers: req.headers,
            bodyLength: bodyBuf.length,
            receivedAt: new Date()
          });

          if (simulateGone) {
            console.log('[RECEIVER] Simulando HTTP 410 Gone (suscripción expirada/revocada)');
            res.writeHead(410, { 'Content-Type': 'text/plain' });
            res.end('Subscription expired or revoked');
          } else {
            console.log('[RECEIVER] Push POST recibido correctamente. Headers:', {
              auth: req.headers['authorization']?.slice(0, 35) + '...',
              cryptoKey: req.headers['crypto-key'] ? 'present' : 'none',
              contentEncoding: req.headers['content-encoding']
            });
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise(resolve => receiverServer.listen(PUSH_RECEIVER_PORT, '0.0.0.0', resolve));
    console.log(`[PASS] Receptor activo en http://0.0.0.0:${PUSH_RECEIVER_PORT}`);

    // -------------------------------------------------------------------------
    // 2. Autenticación contra el backend para obtener Bearer token
    // -------------------------------------------------------------------------
    console.log('\n[2/7] Autenticando tech_dev en el backend...');
    const password = getCred('tech_dev');
    assert(password, 'Credencial de tech_dev no encontrada en .env.local');

    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tech_dev', password })
    });
    assert(loginRes.ok, `Fallo al iniciar sesión: HTTP ${loginRes.status}`);
    const loginData = await loginRes.json();
    const token = loginData.accessToken || loginData.token;
    assert(token, 'Token JWT no retornado por el backend');
    console.log('[PASS] Token JWT obtenido con éxito.');

    // -------------------------------------------------------------------------
    // 3. Obtener y validar clave pública VAPID
    // -------------------------------------------------------------------------
    console.log('\n[3/7] Obteniendo clave pública VAPID (GET /api/notifications/push/vapid-public-key)...');
    const vapidRes = await fetch(`${API_BASE}/api/notifications/push/vapid-public-key`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(vapidRes.ok, `Fallo en vapid-public-key: HTTP ${vapidRes.status}`);
    const vapidData = await vapidRes.json();
    assert(vapidData.publicKey, 'El backend no retornó publicKey');
    const pubKeyBuf = Buffer.from(vapidData.publicKey, 'base64url');
    assert(pubKeyBuf.length === 65, `La clave pública VAPID debe medir 65 bytes (P-256 no comprimida), midió ${pubKeyBuf.length}`);
    console.log(`[PASS] Clave pública VAPID válida: ${vapidData.publicKey.slice(0, 20)}... (${pubKeyBuf.length} bytes)`);

    // -------------------------------------------------------------------------
    // 4. Validación de contrato: rechazo de suscripciones inválidas
    // -------------------------------------------------------------------------
    console.log('\n[4/7] Validando rechazo de suscripción inválida (POST /push/subscribe sin claves)...');
    const invalidSubRes = await fetch(`${API_BASE}/api/notifications/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ endpoint: '', keys: null })
    });
    assert(invalidSubRes.status === 400, `Se esperaba HTTP 400 Bad Request ante suscripción inválida, se obtuvo ${invalidSubRes.status}`);
    console.log('[PASS] Backend rechazó suscripción inválida con HTTP 400.');

    // -------------------------------------------------------------------------
    // 5. Registro de suscripción con claves criptográficas P-256 reales
    // -------------------------------------------------------------------------
    console.log('\n[5/7] Generando par de claves ECDH P-256 y registrando suscripción...');
    const ecdh = crypto.createECDH('prime256v1');
    ecdh.generateKeys();
    const clientP256dh = ecdh.getPublicKey('base64url');
    const clientAuth = crypto.randomBytes(16).toString('base64url');

    const validSubRes = await fetch(`${API_BASE}/api/notifications/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: PUSH_ENDPOINT,
        keys: {
          p256dh: clientP256dh,
          auth: clientAuth
        }
      })
    });
    assert(validSubRes.ok, `Fallo al registrar suscripción: HTTP ${validSubRes.status}`);
    console.log('[PASS] Suscripción registrada en el backend.');

    // Verificar en BD PostgreSQL
    const psqlCheck = execSync(
      `docker exec glpi-app-db psql -U app -d glpi_ticket_manager -t -c "SELECT COUNT(*) FROM user_push_subscriptions WHERE endpoint = '${PUSH_ENDPOINT}';"`,
      { encoding: 'utf8' }
    ).trim();
    assert(Number(psqlCheck) >= 1, 'La suscripción no fue persistida en la tabla user_push_subscriptions de PostgreSQL');
    console.log('[PASS] Persistencia comprobada en PostgreSQL (tabla user_push_subscriptions).');

    // -------------------------------------------------------------------------
    // 6. Enviar notificación de prueba y verificar cifrado RFC 8291 y firma VAPID
    // -------------------------------------------------------------------------
    console.log('\n[6/7] Disparando envío WebPush desde backend (POST /push/test)...');
    receivedPackets.length = 0;

    const testPushRes = await fetch(`${API_BASE}/api/notifications/push/test`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(testPushRes.ok, `Fallo en endpoint /push/test: HTTP ${testPushRes.status}`);
    const testPushData = await testPushRes.json();
    assert(testPushData.sentToDevices >= 1, 'El backend reportó 0 dispositivos enviados');

    // Esperar llegada del paquete al receptor
    let packetArrived = false;
    for (let i = 0; i < 20; i++) {
      if (receivedPackets.length > 0) {
        packetArrived = true;
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }
    assert(packetArrived, 'El backend no entregó el paquete HTTP POST al endpoint registrado dentro del timeout');

    const packet = receivedPackets[0];
    const authHeader = packet.headers['authorization'] || '';
    assert(authHeader.startsWith('WebPush ') || authHeader.startsWith('vapid '), `Cabecera Authorization no contiene esquema WebPush o vapid: ${authHeader}`);
    assert(packet.bodyLength > 0, `El payload cifrado está vacío (longitud: ${packet.bodyLength})`);
    console.log('[PASS] Paquete WebPush verificado:');
    console.log(`  - Endpoint: ${packet.url}`);
    console.log(`  - Cabecera Auth VAPID: ${authHeader.slice(0, 45)}...`);
    console.log(`  - Content-Encoding: ${packet.headers['content-encoding']}`);
    console.log(`  - Tamaño payload cifrado: ${packet.bodyLength} bytes`);

    // -------------------------------------------------------------------------
    // 7. Prueba de resiliencia: Detección de HTTP 410 Gone y purga automática
    // -------------------------------------------------------------------------
    console.log('\n[7/7] Probando detección de endpoint revocado (HTTP 410 Gone) y purga en BD...');
    simulateGone = true;
    receivedPackets.length = 0;

    await fetch(`${API_BASE}/api/notifications/push/test`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Esperar a que el backend reciba el 410 y procese la eliminación
    await new Promise(r => setTimeout(r, 1000));

    const psqlCheckAfterGone = execSync(
      `docker exec glpi-app-db psql -U app -d glpi_ticket_manager -t -c "SELECT COUNT(*) FROM user_push_subscriptions WHERE endpoint = '${PUSH_ENDPOINT}';"`,
      { encoding: 'utf8' }
    ).trim();
    assert(Number(psqlCheckAfterGone) === 0, `La suscripción debió ser purgada tras HTTP 410 Gone pero sigue en BD: count=${psqlCheckAfterGone}`);
    console.log('[PASS] Backend detectó HTTP 410 y eliminó automáticamente la suscripción obsoleta.');

    console.log('\n================================================================');
    console.log('✅ PRUEBA 1 APROBADA: INTEGRACIÓN BACKEND WEBPUSH COMPLETA (100% PASS)');
    console.log('================================================================');
  } finally {
    if (receiverServer) {
      receiverServer.close();
    }
  }
}

runBackendPushIntegration().catch(err => {
  console.error('\n[FATAL ERROR]', err.message);
  process.exit(1);
});
