/**
 * Success Gate Validator
 * Evaluates success gates from phase.yaml against execution result.
 */

function compare(op, actual, expected) {
  switch (op) {
    case '>=':
      return actual >= expected;
    case '<=':
      return actual <= expected;
    case '>':
      return actual > expected;
    case '<':
      return actual < expected;
    case '==':
      return actual === expected;
    case '!=':
      return actual !== expected;
    default:
      return false;
  }
}

/**
 * Validate all success gates for a phase.
 * @param {Object} phase - Phase configuration
 * @param {Object} result - Docker execution result { exitCode, stdout, stderr, metrics }
 * @returns {Promise<{passed: boolean, gates: Array}>} overall result + per-gate detail
 */
async function validateSuccessGates(phase, result) {
  const gates = phase.success_gates || [];

  if (gates.length === 0) {
    // No gates defined — pass if exit code is 0
    const passed = result.exitCode === 0;
    return { passed, gates: [{ type: 'exit_code', value: 0, actual: result.exitCode, passed }] };
  }

  const gateResults = [];

  for (const gate of gates) {
    let passed = false;
    let actual;

    switch (gate.type) {
      case 'exit_code':
        actual = result.exitCode;
        passed = result.exitCode === gate.value;
        console.log(`  [GATE] exit_code: ${result.exitCode} === ${gate.value} ? ${passed}`);
        gateResults.push({ type: 'exit_code', value: gate.value, actual, passed });
        break;

      case 'metric':
        {
          actual = result.metrics[gate.key];
          if (actual === undefined) {
            console.log(`  [GATE] metric.${gate.key}: MISSING (required)`);
            passed = false;
          } else {
            passed = compare(gate.op, actual, gate.value);
            console.log(
              `  [GATE] metric.${gate.key}: ${actual} ${gate.op} ${gate.value} ? ${passed}`
            );
          }
          gateResults.push({
            type: 'metric',
            key: gate.key,
            op: gate.op,
            value: gate.value,
            actual: actual === undefined ? null : actual,
            passed,
          });
        }
        break;

      case 'output':
        {
          const pattern = new RegExp(gate.pattern);
          passed = pattern.test(result.stdout);
          console.log(`  [GATE] output.${gate.pattern}: ${passed}`);
          gateResults.push({ type: 'output', pattern: gate.pattern, passed });
        }
        break;

      default:
        console.log(`  [GATE] unknown type: ${gate.type}`);
        gateResults.push({ type: gate.type, passed: false });
    }
  }

  return { passed: gateResults.every((g) => g.passed), gates: gateResults };
}

module.exports = { validateSuccessGates, compare };
