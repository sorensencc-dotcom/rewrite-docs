interface CliConfig {
    apiBaseUrl: string;
    authToken?: string;
    sloBudgetMs: number;
}
export declare class ConfigManager {
    private static configPath;
    static ensureConfigFile(): void;
    static load(): CliConfig;
    static getApiBaseUrl(): string;
    static getAuthToken(): string | undefined;
    static getSloBudgetMs(): number;
}
export {};
//# sourceMappingURL=config-manager.d.ts.map