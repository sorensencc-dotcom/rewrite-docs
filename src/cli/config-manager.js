import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
export class ConfigManager {
    static configPath = path.join(os.homedir(), '.cic-cli', 'config.json');
    static ensureConfigFile() {
        const dir = path.dirname(this.configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.configPath)) {
            const defaultConfig = {
                apiBaseUrl: 'http://localhost:3000',
                sloBudgetMs: 500
            };
            fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
        }
    }
    static load() {
        this.ensureConfigFile();
        const raw = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(raw);
    }
    static getApiBaseUrl() {
        return this.load().apiBaseUrl;
    }
    static getAuthToken() {
        return this.load().authToken;
    }
    static getSloBudgetMs() {
        return this.load().sloBudgetMs;
    }
}
//# sourceMappingURL=config-manager.js.map