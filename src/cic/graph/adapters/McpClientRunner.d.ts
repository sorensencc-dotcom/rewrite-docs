export interface McpServerConfig {
    command: string;
    args: string[];
}
export interface McpConfig {
    mcpServers: Record<string, McpServerConfig>;
}
export declare class McpClientRunner {
    private static loadConfig;
    static callTool(serverName: string, toolName: string, args: any): Promise<any>;
}
//# sourceMappingURL=McpClientRunner.d.ts.map