// Governance Amendment Generator (Phase 24.2)
// Generates amendments from drift signals

import axios from 'axios';
import { v4 as uuid } from 'uuid';

export interface AmendmentPacket {
  id: string;
  type: 'AMENDMENT_PROPOSAL';
  timestamp: string;
  drift: any;
  rationale: string;
}

export class GovernanceAmendmentGenerator {
  private memoryUrl = process.env.MEMORY_BASE_URL || 'http://localhost:3100';
  private vaultUrl = process.env.VAULT_BASE_URL || 'http://localhost:3100';

  async generate(): Promise<AmendmentPacket> {
    try {
      // Fetch drift signals from memory (via TorqueQuery)
      const driftResponse = await axios.get(
        `${this.memoryUrl}/api/torquequery/memory/by-signal/drift`,
        { timeout: 5000 }
      );

      const drift = driftResponse.data.signals || [];
      const timestamp = new Date().toISOString();

      const packet: AmendmentPacket = {
        id: uuid(),
        type: 'AMENDMENT_PROPOSAL',
        timestamp,
        drift,
        rationale: 'Drift detected in system behavior; proposing amendment.',
      };

      return packet;
    } catch (error) {
      console.error('Failed to generate amendment:', error);
      throw error;
    }
  }
}
