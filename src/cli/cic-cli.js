import { Command } from 'commander';
import { MaalOrchestratorV3 } from '../maal/core/maal-orchestrator-v3';
import { ExecutionHistory } from '../maal/core/execution-history';
import { ConfigManager } from './config-manager';
const program = new Command();
program.name('cic-cli').description('Operator CLI for Sandbox-3/MAAL');
program
    .command('run')
    .description('Execute a payload against a model')
    .requiredOption('-m, --model <modelId>', 'Model identifier')
    .requiredOption('-p, --payload <code>', 'Code payload to execute')
    .option('-s, --seed <n>', 'Determinism seed', (v) => parseInt(v, 10))
    .option('--trace', 'Collect full trace')
    .action(async (opts) => {
    const orchestrator = new MaalOrchestratorV3(ConfigManager.getSloBudgetMs());
    const { result, manifest } = await orchestrator.executePayload(opts.model, opts.payload, opts.seed ?? Date.now());
    console.log(JSON.stringify({ result, manifest }, null, 2));
});
program
    .command('metrics')
    .description('Fetch latest metrics for a model')
    .requiredOption('-m, --model <modelId>', 'Model identifier')
    .action(async (opts) => {
    const history = new ExecutionHistory();
    const metrics = await history.getMetrics(opts.model);
    console.table(metrics);
});
program.parseAsync(process.argv);
//# sourceMappingURL=cic-cli.js.map