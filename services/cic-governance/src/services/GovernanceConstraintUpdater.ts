// Governance Constraint Updater (Phase 24.2)
// Generates constraint updates from system signals

import axios from 'axios';
import { v4 as uuid } from 'uuid';

export interface ConstraintUpdatePacket {
  id: string;
  type: 'CONSTRAINT_UPDATE';
  timestamp: string;
  signals: any[];
  rationale: string;
}

export class GovernanceConstraintUpdater {
  private memoryUrl = process.env.MEMORY_BASE_URL || 'http://localhost:3100';

  async generate(): Promise<ConstraintUpdatePacket> {
    try {
      // Fetch constraint-related signals from memory
      const signalsResponse = await axios.get(
        `${this.memoryUrl}/api/torquequery/memory/by-type/CONSTRAINT_SCAN`,
        { timeout: 5000 }
      );

      const signals = signalsResponse.data.events || [];
      const timestamp = new Date().toISOString();

      const packet: ConstraintUpdatePacket = {
        id: uuid(),
        type: 'CONSTRAINT_UPDATE',
        timestamp,
        signals,
        rationale: 'Constraint update triggered by system signals.',
      };

      return packet;
    } catch (error) {
      console.error('Failed to generate constraint update:', error);
      throw error;
    }
  }
}
