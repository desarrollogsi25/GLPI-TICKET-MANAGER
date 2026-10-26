/**
 * Inicialización del tema (anti-FOUC).
 *
 * Se ejecuta desde el <head> sin defer/async para fijar la clase `dark`, el atributo
 * `data-theme` y el preset `data-dark-preset` antes del primer pintado.
 *
 * Vive en un fichero externo y no en index.html porque la CSP del contenedor es
 * `script-src 'self'`, que bloquea cualquier <script> inline; un fichero propio se
 * sirve como mismo origen y por lo tanto pasa la directiva sin `unsafe-inline`.
 */
(function () {
  try {
    var theme = localStorage.getItem('theme');
    var preset = localStorage.getItem('glpi_dark_preset') || 'midnight';
    document.documentElement.setAttribute('data-dark-preset', preset);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (_) {}
})();
