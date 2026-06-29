import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface CliConfig {
  apiBaseUrl: string;
  authToken?: string;
  sloBudgetMs: number;
}

export class ConfigManager {
  private static configPath = path.join(os.homedir(), '.cic-cli', 'config.json');

  static ensureConfigFile() {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.configPath)) {
      const defaultConfig: CliConfig = {
        apiBaseUrl: 'http://localhost:3000',
        sloBudgetMs: 500
      };
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    }
  }

  static load(): CliConfig {
    this.ensureConfigFile();
    const raw = fs.readFileSync(this.configPath, 'utf8');
    return JSON.parse(raw) as CliConfig;
  }

  static getApiBaseUrl(): string {
    return this.load().apiBaseUrl;
  }

  static getAuthToken(): string | undefined {
    return this.load().authToken;
  }

  static getSloBudgetMs(): number {
    return this.load().sloBudgetMs;
  }
}
