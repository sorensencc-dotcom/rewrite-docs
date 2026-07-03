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
 * @returns {Promise<boolean>} true if all gates pass
 */
async function validateSuccessGates(phase, result) {
  const gates = phase.success_gates || [];

  if (gates.length === 0) {
    // No gates defined — pass if exit code is 0
    return result.exitCode === 0;
  }

  for (const gate of gates) {
    let passed = false;

    switch (gate.type) {
      case 'exit_code':
        passed = result.exitCode === gate.value;
        console.log(`  [GATE] exit_code: ${result.exitCode} === ${gate.value} ? ${passed}`);
        break;

      case 'metric':
        {
          const actual = result.metrics[gate.key];
          if (actual === undefined) {
            console.log(`  [GATE] metric.${gate.key}: MISSING (required)`);
            passed = false;
          } else {
            passed = compare(gate.op, actual, gate.value);
            console.log(
              `  [GATE] metric.${gate.key}: ${actual} ${gate.op} ${gate.value} ? ${passed}`
            );
          }
        }
        break;

      case 'output':
        {
          const pattern = new RegExp(gate.pattern);
          passed = pattern.test(result.stdout);
          console.log(`  [GATE] output.${gate.pattern}: ${passed}`);
        }
        break;

      default:
        console.log(`  [GATE] unknown type: ${gate.type}`);
        passed = false;
    }

    if (!passed) {
      return false;
    }
  }

  return true;
}

module.exports = { validateSuccessGates, compare };
