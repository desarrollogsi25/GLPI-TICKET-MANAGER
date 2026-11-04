# Protocolo de Prueba Manual: Web Push PWA en Windows y Dispositivos Móviles

## 1. Estado de Verificación

| Componente | Estado | Tipo de Prueba | Evidencia |
| :--- | :--- | :--- | :--- |
| **Backend WebPush (RFC 8291 / 8292)** | **APROBADO (100% PASS) 🟢** | Automatizada (CI & Local) | Cifrado AES-GCM, firma VAPID, suscripción y purga 410 verificados |
| **PWA Service Worker & PushManager** | **APROBADO (100% PASS) 🟢** | Automatizada (CI & Local) | Registro `/sw.js`, W3C Secure Context, escuchas `push` y `notificationclick` |
| **Recepción Visible en Windows Action Center** | **PENDIENTE (Prueba Manual) 🟡** | Manual en Navegador de Escritorio | Requiere instalación de CA en almacén de Windows y conexión FCM del navegador |
| **Recepción en Dispositivo Android Físico** | **PENDIENTE / NO VERIFICADO ⚪** | Manual en Hardware Real | Requiere dispositivo físico conectado a la red local |

---

## 2. Diagnóstico Técnico: Por Qué la Entrega en Windows Requiere Prueba Manual

1. **Broker en la Nube Requerido por la Especificación W3C Push:**
   - La API W3C `PushManager.subscribe()` no realiza una conexión directa punto a punto entre el backend y el navegador.
   - En navegadores basados en Chromium (Google Chrome, Microsoft Edge), el navegador contacta con el servicio Firebase Cloud Messaging (FCM) de Google (`https://fcm.googleapis.com`) para aprovisionar un endpoint público único para ese perfil.
   - En entornos automatizados desasistidos (como Chromium en Playwright o contenedores CI en Linux):
     - No existe sesión de Google ni servicio FCM activo en segundo plano.
     - Chromium responde nativamente con `AbortError: Registration failed - permission denied`.
     - No existe integración con el Shell de Windows (`Windows.UI.Notifications`). Simular la notificación mediante scripts externos (p. ej. PowerShell `ToastNotificationManager`) desvirtúa la prueba real del navegador.

2. **Confianza del Certificado TLS (HTTPS):**
   - El entorno LAN utiliza certificados emitidos por la entidad interna `GLPI LAN Root CA` (`infra/nginx/certs/ca.crt`).
   - Al no estar importada en el almacén de "Entidades de certificación raíz de confianza" de Windows, el navegador marca la conexión como `ERR_CERT_AUTHORITY_INVALID`.
   - Chromium desactiva o restringe drásticamente las funciones PWA en segundo plano y el registro de Push Managers en dominios con certificados no confiables.

---

## 3. Guía Paso a Paso para la Prueba Manual en Windows

### Paso 1: Instalar la CA Raíz en Windows (Sólo una vez por equipo)
1. Abrir PowerShell como Administrador.
2. Ejecutar:
   ```powershell
   Import-Certificate -FilePath "infra\nginx\certs\ca.crt" -CertStoreLocation Cert:\LocalMachine\Root
   ```
3. Reiniciar el navegador Microsoft Edge o Google Chrome.
4. Navegar a `https://10.10.40.31` y verificar que la barra de direcciones muestra el candado seguro sin advertencias de certificado.

### Paso 2: Suscribirse a Notificaciones en Ticket Manager
1. Iniciar sesión en Ticket Manager con el usuario `tech_dev`.
2. Ir a la esquina superior derecha / Configuración de Usuario.
3. Hacer clic en **"Activar Notificaciones Push"**.
4. En el diálogo nativo del navegador, hacer clic en **"Permitir"**.
5. Verificar en consola F12 que la llamada `POST /api/notifications/push/subscribe` respondió `200 OK`.

### Paso 3: Probar Recepción con Pestaña Cerrada
1. Cerrar la pestaña de Ticket Manager en el navegador (o minimizar el navegador por completo).
2. Desde otra sesión (o desde GLPI `http://localhost:8081` como `admin`):
   - Crear o asignar un ticket al técnico `tech_dev`.
   - O bien ejecutar la petición de prueba en el backend:
     ```bash
     curl -X POST https://10.10.40.31/api/notifications/push/test -H "Authorization: Bearer <TOKEN>"
     ```
3. **Criterio de Aceptación Visual:**
   - Debe emerger el banner tipo Toast en la esquina inferior derecha de la pantalla de Windows.
   - Debe aparecer registrada en el Centro de Actividades (`Win + N`).
   - El título debe indicar `GLPI Ticket Manager` y el cuerpo el asunto de la incidencia.

### Paso 4: Probar Apertura y Foco del Ticket al Pulsar la Notificación
1. Hacer clic sobre la notificación toast en Windows.
2. **Criterio de Aceptación de Interacción:**
   - Windows enfoca la ventana del navegador.
   - El manejador `notificationclick` del Service Worker abre o enfoca la ruta del ticket `/tickets/{id}`.
   - La pantalla muestra los detalles completos del ticket y sus tareas asociadas.

---

## 4. Guía para la Prueba en Android Físico (Pendiente)

1. Conectar el terminal Android a la misma red Wi-Fi/LAN (`10.10.40.x`).
2. Transferir e instalar el certificado `ca.crt` en "Ajustes > Seguridad > Certificados de usuario/CA".
3. Abrir Chrome para Android y acceder a `https://10.10.40.31`.
4. Pulsar "Instalar aplicación" (PWA en pantalla de inicio).
5. Aceptar permisos de notificación.
6. Bloquear la pantalla del dispositivo.
7. Disparar evento de ticket y verificar la vibración y notificación push en la barra de estado de Android.
