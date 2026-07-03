// Governance Evolution Loop (Phase 24.2)
// Orchestrates autonomous constitutional amendment cycle

import { GovernanceAmendmentGenerator, AmendmentPacket } from './GovernanceAmendmentGenerator';
import { GovernanceConstraintUpdater, ConstraintUpdatePacket } from './GovernanceConstraintUpdater';
import { GovernancePolicyUpdater, PolicyUpdatePacket } from './GovernancePolicyUpdater';
import axios from 'axios';

export type EvolutionPacket = AmendmentPacket | ConstraintUpdatePacket | PolicyUpdatePacket;

export class GovernanceEvolutionLoop {
  private vaultUrl = process.env.VAULT_BASE_URL || 'http://localhost:3100';
  private amendmentGen: GovernanceAmendmentGenerator;
  private constraintGen: GovernanceConstraintUpdater;
  private policyGen: GovernancePolicyUpdater;

  constructor() {
    this.amendmentGen = new GovernanceAmendmentGenerator();
    this.constraintGen = new GovernanceConstraintUpdater();
    this.policyGen = new GovernancePolicyUpdater();
  }

  async run(): Promise<EvolutionPacket[]> {
    const packets: EvolutionPacket[] = [];

    // Generate amendments
    try {
      const amendment = await this.amendmentGen.generate();
      packets.push(amendment);
      await this.persistPacket(amendment);
    } catch (error) {
      console.error('Amendment generation failed:', error);
    }

    // Generate constraint updates
    try {
      const constraint = await this.constraintGen.generate();
      packets.push(constraint);
      await this.persistPacket(constraint);
    } catch (error) {
      console.error('Constraint update generation failed:', error);
    }

    // Generate policy updates
    try {
      const policy = await this.policyGen.generate();
      packets.push(policy);
      await this.persistPacket(policy);
    } catch (error) {
      console.error('Policy update generation failed:', error);
    }

    return packets;
  }

  private async persistPacket(packet: EvolutionPacket): Promise<void> {
    try {
      await axios.post(
        `${this.vaultUrl}/api/vault/records`,
        {
          kind: 'evolution_packet',
          payload: packet,
        },
        { timeout: 5000 }
      );
    } catch (error) {
      console.error('Failed to persist evolution packet:', error);
      throw error;
    }
  }

  async runPeriodic(intervalMs = 86400000): Promise<void> {
    setInterval(async () => {
      try {
        await this.run();
        console.log('Evolution cycle completed');
      } catch (error) {
        console.error('Evolution cycle failed:', error);
      }
    }, intervalMs);
  }
}
