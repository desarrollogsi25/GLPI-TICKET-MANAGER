# TLS: investigación y reversión — 2026-11-05

Estado: investigación de lectura; **NO se importó ninguna CA, cambió ningún montaje ni reinició ningún servicio persistente**. Autorización del usuario denegada para importar en `CurrentUser\Root`; se requiere una nueva autorización específica. Rama `codex/mission-audit-20261104`, HEAD publicado al investigar `bda3c712fa047aeebb9399cf2f69be88b3517550`, PR borrador #43.

## Discrepancia resuelta

Las dos huellas corresponden al mismo archivo actual, con entradas distintas al cálculo SHA-256:

- Archivo PEM `infra/nginx/certs/ca.crt`: `3EC66233705576C65FE3E549A097448FABE01616060B55F5C7B21344C0082A4A`.
- Certificado X.509 DER contenido en ese PEM: `859437B4776EFD3FFB8987E8028D7863C6B91B9A590A9761E93142C717884451`.

La primera coincide con el valor informado anteriormente por Antigravity. La comunicación anterior de Codex debía distinguir hash del archivo y huella del certificado. La discrepancia no demuestra regeneración. El archivo y certificado actuales apuntan al 3 de noviembre de 2026, 18:34:14 UTC; los timestamps del sistema de archivos no constituyen por sí solos una prueba forense de quién lo generó. Los certificados están ignorados y no tienen historia Git local que permita atribuir su creación.

CA: sujeto/emisor `CN=GLPI LAN Root CA, O=Empresa, C=ES`, serial `58E1440F28C1617EF4F64DF07210B9C5D07980C2`, CA=true, autofirma válida, clave privada correspondiente. Vigencia: 2026-11-03 18:34:14 UTC a 2036-10-31 18:34:14 UTC.

Servidor: sujeto `CN=10.10.40.31, O=Empresa, C=ES`, emisor la CA anterior, serial `7B00D669007BA2C5AD41744F082E370C0EB19C72`. Vigencia: 2026-11-03 18:34:14 UTC a 2029-02-05 18:34:14 UTC. Firma y correspondencia con `server.key` verificadas.

- SHA-256 archivo PEM servidor: `79C4DBB83E5AAFFB7C22399C0FD463F59AF997BC1D00F1524CDCBDDCC37C6F8F`.
- SHA-256 DER servidor: `24C0C4C28B4704FAACA5F42EC9F3229F4B599D453E0963FD4F4286E555358840`.
- SAN: IP `10.10.40.31`, IP `127.0.0.1`, DNS `localhost`.

## Cadena realmente presentada

Conexiones TLS 1.3 verificadas con `rejectUnauthorized=true`, CA explícita en memoria y comprobación normal de nombre/IP a los tres nombres anteriores en el puerto host 443: PASS. Ese puerto corresponde al frontend LAN.

Además se verificó el puerto interno 443 **por separado** de `glpi-frontend` y `glpi-lan-frontend`, mediante sondas Node de sólo lectura en su respectivo namespace de red, sin volúmenes, sin capacidades y eliminadas tras finalizar. Ambos presentan exactamente el DER servidor anterior y verifican su cadena y `localhost`: PASS. No se cambió la confianza de Windows. La ausencia previa de esta CA en Root y el rechazo con la confianza predeterminada siguen siendo un pendiente para navegador/PWA; una CA explícita en una sonda no equivale a confianza del SO.

## Exposición y alcance comprobado

Inventario de montajes de todos los contenedores existentes: únicamente ambos frontends montan el directorio original completo en `/etc/nginx/certs`, sólo lectura. Esto incluye innecesariamente `ca.key`. Es legible por root de esos contenedores, aunque no por el usuario trabajador nginx. No se hallaron archivos `*.key` bajo su raíz web pública. El API no tiene mounts; las rutas de certificados candidatas comprobadas en su runtime no contienen esa clave. No se inspeccionaron exhaustivamente todas las capas históricas ni caches de Docker.

La `.dockerignore` raíz no excluía expresamente el directorio de certificados ni todos los artefactos locales sensibles. La inspección del Dockerfile API actual confirma copias selectivas de proyectos y `src/`, **no** `COPY . .`: no hay evidencia de que ese Dockerfile incorporara los certificados a su etapa SDK. Aun así faltaba excluirlos explícitamente del contexto permitido de build, como defensa ante cambios futuros u otros consumidores. Se preparó una corrección de código que excluye certificados, claves y artefactos locales de futuros builds. No altera certificados, confianza ni contenedores persistentes. No se borraron ni inspeccionaron exhaustivamente caches/capas históricas; no se afirma exposición demostrada en ellas.

Git: ninguna ruta de certificados está versionada ni tiene historia local encontrada. Búsqueda exacta del PEM de la clave CA actual en todos los blobs alcanzables de las refs locales: 1.561 blobs, 46.878.451 bytes, cero coincidencias, cero blobs grandes omitidos. Árboles GitHub de main y HEAD publicado de PR #43: ninguna ruta de certificados/claves PEM/PFX/P12 encontrada. Esto no demuestra ausencia en archivos renombrados, codificaciones alternativas, archivos comprimidos, refs remotas no descargadas, caches, artefactos CI o publicaciones externas. Nunca se copiaron claves privadas a este informe ni a logs. ACL local sin permisos amplios de lectura para Everyone/Authenticated Users/Users en la comprobación realizada.

## Cambio propuesto y preservación

El compose local propuesto en el PR sustituye el bind del directorio por dos binds de archivos, `server.crt` y `server.key`, ambos de sólo lectura. Nginx sólo necesita esos dos archivos para servir TLS; la clave CA debe quedar fuera de los frontends. Aplicarlo requiere recrear únicamente ambos frontends, con una interrupción breve de sus conexiones HTTP/WebSocket. No requiere reiniciar GLPI, API ni bases, ni tocar volúmenes de datos. **Pendiente de autorización; no aplicado.**

Advertencia material: `docker diff` muestra archivos web modificados dentro de ambos contenedores respecto de la imagen original. Recrear sólo con esa imagen podría revertir la versión servida. Imagen actual compartida: `sha256:5de83c3a1459d8ee8b9364db722b834a63fa573dd4171ab7ff1de47cd58152eb`.

Se guardó copia de lectura de los 30 archivos públicos de cada frontend, con manifests SHA-256 separados, en el directorio local temporal `C:\Users\DEVELO~1\AppData\Local\Temp\glpi-tls-public-rollback-urvyne`. No incluye el directorio de certificados. Esta copia temporal debe preservarse/verificarse en almacenamiento local duradero antes de autorizar una recreación; no constituye backup de bases ni de la configuración secreta.

Procedimiento propuesto, aún no ejecutado:

1. Verificar hashes de la copia pública, configuración nginx/compose y digest de imagen; preparar imagen local reproducible que conserve los assets actuales o un build expresamente aceptado. No usar `docker commit` ciego ni asumir que el tag recupera archivos modificados.
2. Validar configuración y recrear únicamente ambos frontends con los binds de servidor; comprobar salud, assets, rutas, TLS, ausencia de `ca.key` y reconexión SignalR. No ejecutar `down -v` ni limpieza de volúmenes.
3. Si falla, recrear únicamente los frontends con la configuración previa y los assets preservados, comprobar los mismos hashes y salud. Restaurar el bind completo reintroduciría la exposición: sería una reversión temporal, no la solución definitiva.
4. Los certificados no se regeneran en este cambio. Preservar originales con ACL restrictiva fuera de la raíz web. Si se propusiera reemplazarlos, guardar primero certificados/configuración y una copia privada protegida de sus claves fuera de Git; validar cadena y SAN antes del reemplazo y restaurar el conjunto anterior si falla.
5. La confianza Windows es una operación independiente. Si el usuario la autoriza después, importar sólo el DER SHA-256 indicado y registrar el thumbprint de almacén y estado previo. Reversión: retirar exclusivamente el certificado que esta operación hubiera agregado a `CurrentUser\Root`, tras verificar su identidad; nunca borrar certificados por coincidencia parcial de nombre. No modificar `LocalMachine\Root`.

Riesgo actual: exposición innecesaria de clave CA a root de dos contenedores; no hay evidencia encontrada de publicación en Git. La confianza HTTPS normal, PWA Windows/Android y recepción push nativa siguen pendientes. No se declara la misión terminada.
