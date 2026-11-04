/**
 * PWA WebPush Verification Suite Orchestrator
 * Ejecuta de forma secuencial y estricta:
 * 1. Prueba de integración del backend (VAPID, cifrado RFC 8291, entrega y purga 410)
 * 2. Prueba de integración del navegador y Service Worker (HTTPS, W3C Secure Context, PushManager y manejadores)
 */
import { execSync } from 'node:child_process';
import path from 'node:path';

console.log('================================================================');
console.log('ORQUESTADOR DE VERIFICACIÓN PWA & WEBPUSH');
console.log('================================================================');

try {
  console.log('\n>>> EJECUTANDO PARTE 1: INTEGRACIÓN BACKEND WEBPUSH...');
  execSync('node tests/qa/backend_push_integration.mjs', { stdio: 'inherit' });

  console.log('\n>>> EJECUTANDO PARTE 2: INTEGRACIÓN NAVEGADOR & SERVICE WORKER...');
  execSync('node tests/qa/browser_sw_push_integration.mjs', { stdio: 'inherit' });

  console.log('\n================================================================');
  console.log('✅ TODAS LAS PRUEBAS AUTOMATIZADAS DE PWA Y WEBPUSH APROBADAS (100% PASS)');
  console.log('================================================================');
} catch (error) {
  console.error('\n[FAIL 🔴] Falló una de las suites de verificación PWA.');
  process.exit(1);
}
