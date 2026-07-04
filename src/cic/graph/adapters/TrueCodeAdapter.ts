import { CodeGraphSlice } from '../GraphContext.js';
import { McpClientRunner } from './McpClientRunner.js';
import { mockCodeGraphSlice } from './mocks/TrueCodeMock.js';

export class TrueCodeAdapter {
  static async getStructuralGraph(repo: string, files?: string[]): Promise<CodeGraphSlice> {
    try {
      return await McpClientRunner.callTool('truecode', 'truecode.get_structural_graph', { repo, files });
    } catch (e) {
      console.warn('TrueCode MCP failed, falling back to mock:', e);
      return mockCodeGraphSlice;
    }
  }

  static async getServiceStructure(repo: string, service: string): Promise<CodeGraphSlice> {
    try {
      return await McpClientRunner.callTool('truecode', 'truecode.get_service_structure', { repo, service });
    } catch (e) {
      console.warn('TrueCode MCP failed, falling back to mock:', e);
      return mockCodeGraphSlice;
    }
  }
}
