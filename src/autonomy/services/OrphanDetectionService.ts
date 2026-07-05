/**
 * Orphan Detection Service (Phase 23/24 Integration)
 * Detects and logs orphaned evidence packets
 * Mitigation: Evidence packet orphaning on TTL expiry
 *
 * Weekly scan for packets referenced in proposals but TTL'd in memory layer
 */

import { EventEmitter } from 'events';
import { getMemoryService } from './MemoryService';
import { getGovernanceService } from './GovernanceService';

export interface OrphanedPacket {
  packet_id: string;
  referenced_by_proposal: string;
  memory_expiration: number;
  detected_at: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

class OrphanDetectionService extends EventEmitter {
  private scanIntervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
  private lastScan = 0;
  private orphanedPackets: Map<string, OrphanedPacket> = new Map();
  private isScanning = false;

  /**
   * Run orphan detection scan
   * Checks all active proposals for referenced memory packets
   */
  async scanForOrphans(): Promise<OrphanedPacket[]> {
    if (this.isScanning) return [];
    this.isScanning = true;

    try {
      const memoryService = getMemoryService();
      const governanceService = getGovernanceService();

      const proposals = governanceService.queryProposals({
        status: 'approved', // Only check decided proposals
      });

      const orphaned: OrphanedPacket[] = [];

      for (const proposal of proposals) {
        if (!proposal.evidence_packet_id) continue;

        const packet = await memoryService.getPacket(proposal.evidence_packet_id);

        // If packet is gone but proposal still references it = orphan
        if (!packet && proposal.evidence_packet_id) {
          const orphan: OrphanedPacket = {
            packet_id: proposal.evidence_packet_id,
            referenced_by_proposal: proposal.id,
            memory_expiration: 0,
            detected_at: Date.now(),
            risk_level: this.assessRisk(proposal),
          };

          orphaned.push(orphan);
          this.orphanedPackets.set(proposal.evidence_packet_id, orphan);
        }
      }

      this.lastScan = Date.now();

      if (orphaned.length > 0) {
        this.emit('orphans_detected', {
          count: orphaned.length,
          scan_time: Date.now(),
          orphans: orphaned,
        });
      }

      return orphaned;
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Start periodic scanning
   */
  startPeriodicScanning(): NodeJS.Timer {
    return setInterval(() => this.scanForOrphans(), this.scanIntervalMs);
  }

  /**
   * Get all detected orphans
   */
  getOrphans(): OrphanedPacket[] {
    return Array.from(this.orphanedPackets.values());
  }

  /**
   * Clear orphan record
   */
  clearOrphan(packetId: string): boolean {
    return this.orphanedPackets.delete(packetId);
  }

  /**
   * Get orphan statistics
   */
  getStats() {
    const orphans = Array.from(this.orphanedPackets.values());

    return {
      total_orphans: orphans.length,
      by_risk: {
        critical: orphans.filter(o => o.risk_level === 'critical').length,
        high: orphans.filter(o => o.risk_level === 'high').length,
        medium: orphans.filter(o => o.risk_level === 'medium').length,
        low: orphans.filter(o => o.risk_level === 'low').length,
      },
      last_scan: this.lastScan,
      is_scanning: this.isScanning,
    };
  }

  private assessRisk(proposal: any): 'low' | 'medium' | 'high' | 'critical' {
    // Risk increases if proposal is CRITICAL mitigation-related
    if (proposal.action_type === 'emergency_rollback') return 'critical';
    if (proposal.risk_level === 'critical') return 'critical';
    if (proposal.risk_level === 'high') return 'high';
    if (proposal.action_type === 'policy_update') return 'medium';
    return 'low';
  }
}

// Singleton
let instance: OrphanDetectionService;

export function getOrphanDetectionService(): OrphanDetectionService {
  if (!instance) {
    instance = new OrphanDetectionService();
  }
  return instance;
}

export { OrphanDetectionService };
