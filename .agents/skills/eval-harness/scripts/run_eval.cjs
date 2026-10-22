#!/usr/bin/env node
/**
 * run_eval.cjs — Automated Eval Harness for Antigravity IDE Agent Skills (Node.js runner).
 * Evaluates semantic trigger precision (Should-Trigger vs Should-Not-Trigger).
 * Zero external dependencies — runs directly on Node.js v18+.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_BATTERY = {
  "arch": {
    "should_trigger": [
      "Diseña la estructura de capas para el módulo de facturación",
      "Crea los contratos de interfaces y DTOs para el bounded context de pedidos",
      "Cómo separar la lógica de dominio de la infraestructura en Clean Architecture",
      "Define the hexagonal architecture ports and adapters for payments",
      "Define las entidades de dominio y value objects para el sistema"
    ],
    "should_not_trigger": [
      "Crea un índice B-Tree en la tabla de usuarios",
      "Diseña un botón con animación hover en CSS",
      "Corrige una vulnerabilidad de XSS en este template",
      "Compila el diagrama de arquitectura con Archify",
      "¿Cuál es el clima en Madrid?"
    ]
  },
  "sec": {
    "should_trigger": [
      "Audita este endpoint contra inyecciones SQL y OWASP Top 10",
      "Revisa si este token JWT valida correctamente issuer y expiration",
      "Cómo sanitizar inputs para prevenir Cross-Site Scripting",
      "Verifica que no haya claves API o secretos hardcodeados",
      "Configura cabeceras CSP y HSTS para producción"
    ],
    "should_not_trigger": [
      "Diseña un componente de tabla con paginación en React",
      "Escribe una migración para agregar una columna a PostgreSQL",
      "Dibuja el diagrama de arquitectura en SVG",
      "Refactoriza la clase de dominio para usar Value Objects",
      "Explica cómo funciona la fotosíntesis"
    ]
  },
  "db-master": {
    "should_trigger": [
      "Crea una migración SQL para agregar índices en PostgreSQL",
      "Optimiza este query con EXPLAIN ANALYZE para eliminar seq scan",
      "Configura PgBouncer en Transaction Mode para escalar conexiones",
      "Crea un índice HNSW para búsqueda vectorial con PgVector",
      "Diseña el esquema relacional para la tabla de inventario"
    ],
    "should_not_trigger": [
      "Crea un componente UI con tema oscuro en Tailwind",
      "Audita el middleware de autenticación JWT",
      "Genera el diagrama interactivo en Archify",
      "Define el contrato DTO en C#",
      "Escribe un script de despliegue en Docker"
    ]
  },
  "ui-expert": {
    "should_trigger": [
      "Crea un componente de tarjeta con diseño glassmorphism y animación",
      "Implementa el selector de tema claro y oscuro en React",
      "Corrige los problemas de contraste y accesibilidad WCAG AA",
      "Diseña un dashboard moderno con micro-interacciones",
      "Optimiza el Cumulative Layout Shift de esta vista web"
    ],
    "should_not_trigger": [
      "Crea una migración de base de datos con claves foráneas",
      "Audita vulnerabilidades de inyección en el backend",
      "Configura el pooling de conexiones con PgBouncer",
      "Define las entidades de dominio en DDD",
      "Calcula el radio de impacto en GitNexus"
    ]
  }
};

function extractKeywords(text) {
  const matches = text.toLowerCase().match(/[a-záéíóúñ]{4,}/g);
  return new Set(matches || []);
}

function evaluateSkill(skillDir, battery) {
  const skillFile = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillFile)) return null;

  const content = fs.readFileSync(skillFile, "utf8");
  const descMatch = content.match(/description:\s*([\s\S]*?)(?:\n---|\n[a-z]+:)/);
  const description = descMatch ? descMatch[1].trim() : "";
  const keywords = extractKeywords(description);

  const shouldTrigResults = (battery.should_trigger || []).map(query => {
    const tokens = extractKeywords(query);
    const matched = [...tokens].some(t => keywords.has(t));
    return { query, passed: matched };
  });

  const shouldNotResults = (battery.should_not_trigger || []).map(query => {
    const tokens = extractKeywords(query);
    const overlapCount = [...tokens].filter(t => keywords.has(t)).length;
    return { query, passed: overlapCount < 3 };
  });

  const stPassed = shouldTrigResults.filter(r => r.passed).length;
  const stTotal = shouldTrigResults.length;
  const sntPassed = shouldNotResults.filter(r => r.passed).length;
  const sntTotal = shouldNotResults.length;

  const totalPassed = stPassed + sntPassed;
  const totalCases = stTotal + sntTotal;
  const precision = totalCases > 0 ? (totalPassed / totalCases) * 100 : 0;

  return {
    skill: path.basename(skillDir),
    should_trigger: `${stPassed}/${stTotal}`,
    should_not_trigger: `${sntPassed}/${sntTotal}`,
    precision_pct: Math.round(precision * 10) / 10,
    status: precision >= 90 ? "APPROVED 🟢" : "NEEDS_TUNING 🟡",
    details: {
      should_trigger: shouldTrigResults,
      should_not_trigger: shouldNotResults
    }
  };
}

function main() {
  const args = process.argv.slice(2);
  let agentTarget = null;
  const agentIdx = args.indexOf("--agent");
  if (agentIdx !== -1 && args[agentIdx + 1]) {
    agentTarget = args[agentIdx + 1];
  }

  const skillsRoot = path.resolve(__dirname, "..");
  const results = [];

  for (const [target, battery] of Object.entries(DEFAULT_BATTERY)) {
    if (agentTarget && agentTarget !== target) continue;
    const skillPath = path.join(skillsRoot, "..", target);
    if (fs.existsSync(skillPath)) {
      const res = evaluateSkill(skillPath, battery);
      if (res) results.push(res);
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
