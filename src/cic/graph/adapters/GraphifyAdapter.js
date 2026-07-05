import { McpClientRunner } from './McpClientRunner.js';
import { mockKnowledgeGraphSlice } from './mocks/GraphifyMock.js';
export class GraphifyAdapter {
    static async getDesignIntent(service) {
        try {
            const result = await McpClientRunner.callTool('graphify', 'graphify.get_design_intent', { service });
            return { docs: [], adr: [], designIntent: result };
        }
        catch (e) {
            console.warn('Graphify MCP failed, falling back to mock:', e);
            return mockKnowledgeGraphSlice;
        }
    }
    static async getDocumentedArchitecture(service) {
        try {
            const result = await McpClientRunner.callTool('graphify', 'graphify.get_documented_architecture', { service });
            return { docs: [], adr: [], documentedArchitecture: result };
        }
        catch (e) {
            console.warn('Graphify MCP failed, falling back to mock:', e);
            return mockKnowledgeGraphSlice;
        }
    }
    static async getDiscoveryOverview(service) {
        try {
            return await McpClientRunner.callTool('graphify', 'graphify.get_discovery_overview', { service });
        }
        catch (e) {
            console.warn('Graphify MCP failed, falling back to mock:', e);
            return mockKnowledgeGraphSlice;
        }
    }
}
//# sourceMappingURL=GraphifyAdapter.js.map