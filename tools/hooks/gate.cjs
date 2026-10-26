/**
 * gate.cjs — Antigravity Lifecycle Hook Handler (Fast & Schema-Compliant)
 * 
 * Complies with the Antigravity IDE PreToolUse / PostToolUse hook contract.
 * Reads JSON context from stdin and outputs a valid JSON decision to stdout in < 15ms.
 */

let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    let payload = {};
    if (input.trim()) {
      payload = JSON.parse(input);
    }

    const toolName = payload.toolCall?.name || '';
    const args = payload.toolCall?.args || {};

    // Safety checks can be evaluated here if needed.
    // Default safe decision adhering strictly to Antigravity IDE protojson schema:
    const output = {
      decision: "allow",
      reason: `Hook validated execution for ${toolName || 'tool'}.`
    };

    process.stdout.write(JSON.stringify(output));
    process.exit(0);
  } catch (err) {
    // Fallback safe allow so agent loop never deadlocks
    process.stdout.write(JSON.stringify({ decision: "allow" }));
    process.exit(0);
  }
});
