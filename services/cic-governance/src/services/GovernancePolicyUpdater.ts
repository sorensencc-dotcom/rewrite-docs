// Governance Policy Updater (Phase 24.2)
// Generates policy updates from governance history

import axios from 'axios';
import { v4 as uuid } from 'uuid';

export interface PolicyUpdatePacket {
  id: string;
  type: 'POLICY_UPDATE';
  timestamp: string;
  history: any[];
  rationale: string;
}

export class GovernancePolicyUpdater {
  private vaultUrl = process.env.VAULT_BASE_URL || 'http://localhost:3100';

  async generate(): Promise<PolicyUpdatePacket> {
    try {
      // Fetch governance history from vault
      const historyResponse = await axios.get(
        `${this.vaultUrl}/api/vault/records?kind=governance_decision`,
        { timeout: 5000 }
      );

      const history = historyResponse.data.records || [];
      const timestamp = new Date().toISOString();

      const packet: PolicyUpdatePacket = {
        id: uuid(),
        type: 'POLICY_UPDATE',
        timestamp,
        history,
        rationale: 'Policy update based on governance history.',
      };

      return packet;
    } catch (error) {
      console.error('Failed to generate policy update:', error);
      throw error;
    }
  }
}
