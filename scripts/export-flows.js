const path = require('path');
const fs = require('fs');
const repoRoot = path.resolve(__dirname, '..');
const { chromium } = require(path.join(repoRoot, 'frontend/node_modules/@playwright/test'));

const flowsDir = path.join(repoRoot, 'docs/09-visual-docs/flows');

const files = [
  { name: 'index.html', pdf: 'index.pdf', landscape: false },
  { name: 'glpi-ticket-lifecycle.html', pdf: 'glpi-ticket-lifecycle.pdf', landscape: false },
  { name: 'system-architecture.html', pdf: 'system-architecture.pdf', landscape: true },
  { name: 'unified-flow.html', pdf: 'unified-flow.pdf', landscape: false },
  { name: 'database-diagram.html', pdf: 'database-diagram.pdf', landscape: true }
];

(async () => {
  console.log('Iniciando exportación de flujogramas a PDF...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const item of files) {
    const htmlPath = path.join(flowsDir, item.name);
    const pdfPath = path.join(flowsDir, item.pdf);
    const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: item.landscape,
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    const stats = fs.statSync(pdfPath);
    console.log(`✓ Generado: ${item.pdf} (${stats.size} bytes)`);
  }

  await browser.close();
  console.log('Exportación completada exitosamente.');
})();
