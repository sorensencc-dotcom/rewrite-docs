import * as crypto from 'crypto';
export function prepareDeterministicEnv(seed) {
    const env = {
        TZ: 'UTC',
        LANG: 'C.UTF-8',
        LC_ALL: 'C.UTF-8',
        CIC_DETERMINISTIC: 'true'
    };
    if (seed !== undefined) {
        env.CIC_SEED = String(seed);
    }
    // Hash the environment variables
    const keys = Object.keys(env).sort();
    const envString = keys.map(k => `${k}=${env[k]}`).join('\n');
    const envHash = crypto.createHash('sha256').update(envString).digest('hex');
    return { env, envHash };
}
//# sourceMappingURL=deterministic-env.js.map