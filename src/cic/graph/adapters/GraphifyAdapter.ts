import { KnowledgeGraphSlice } from '../GraphContext.js';
import { McpClientRunner } from './McpClientRunner.js';
import { mockKnowledgeGraphSlice } from './mocks/GraphifyMock.js';

export class GraphifyAdapter {
  static async getDesignIntent(service: string): Promise<KnowledgeGraphSlice> {
    try {
      const result = await McpClientRunner.callTool('graphify', 'graphify.get_design_intent', { service });
      return { docs: [], adr: [], designIntent: result };
    } catch (e) {
      console.warn('Graphify MCP failed, falling back to mock:', e);
      return mockKnowledgeGraphSlice;
    }
  }

  static async getDocumentedArchitecture(service: string): Promise<KnowledgeGraphSlice> {
    try {
      const result = await McpClientRunner.callTool('graphify', 'graphify.get_documented_architecture', { service });
      return { docs: [], adr: [], documentedArchitecture: result };
    } catch (e) {
      console.warn('Graphify MCP failed, falling back to mock:', e);
      return mockKnowledgeGraphSlice;
    }
  }

  static async getDiscoveryOverview(service: string): Promise<KnowledgeGraphSlice> {
    try {
      return await McpClientRunner.callTool('graphify', 'graphify.get_discovery_overview', { service });
    } catch (e) {
      console.warn('Graphify MCP failed, falling back to mock:', e);
      return mockKnowledgeGraphSlice;
    }
  }
}
