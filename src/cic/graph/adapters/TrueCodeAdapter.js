import { McpClientRunner } from './McpClientRunner.js';
import { mockCodeGraphSlice } from './mocks/TrueCodeMock.js';
export class TrueCodeAdapter {
    static async getStructuralGraph(repo, files) {
        try {
            return await McpClientRunner.callTool('truecode', 'truecode.get_structural_graph', { repo, files });
        }
        catch (e) {
            console.warn('TrueCode MCP failed, falling back to mock:', e);
            return mockCodeGraphSlice;
        }
    }
    static async getServiceStructure(repo, service) {
        try {
            return await McpClientRunner.callTool('truecode', 'truecode.get_service_structure', { repo, service });
        }
        catch (e) {
            console.warn('TrueCode MCP failed, falling back to mock:', e);
            return mockCodeGraphSlice;
        }
    }
}
//# sourceMappingURL=TrueCodeAdapter.js.map