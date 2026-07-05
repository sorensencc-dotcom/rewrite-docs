// SCP Manifest Service - Phase 28a.2
// Handles CRUD operations for skill manifest in Postgres
export class ManifestService {
    db;
    constructor(db) {
        this.db = db;
    }
    // Register a skill in the manifest
    async registerSkill(skill) {
        const query = `
      INSERT INTO skill_manifest (
        skill_id, skill_name, local_path,
        source_repo_url, source_repo_branch, source_repo_path,
        last_sync_commit, is_available, is_locally_modified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        skill_name = VALUES(skill_name),
        local_path = VALUES(local_path),
        last_sync_commit = VALUES(last_sync_commit),
        is_available = VALUES(is_available),
        updated_at = CURRENT_TIMESTAMP
    `;
        const result = await this.db.execute(query, [
            skill.id,
            skill.name,
            skill.localPath,
            skill.sourceRepo.url,
            skill.sourceRepo.branch,
            skill.sourceRepo.remotePath,
            skill.sourceRepo.lastSyncCommit,
            skill.available ? 1 : 0,
            skill.localModified ? 1 : 0,
        ]);
        return this.getSkillById(skill.id);
    }
    // Get skill by ID
    async getSkillById(skillId) {
        const query = `
      SELECT * FROM skill_manifest WHERE skill_id = ? LIMIT 1
    `;
        const rows = await this.db.query(query, [skillId]);
        return rows.length > 0 ? rows[0] : null;
    }
    // List all skills
    async listSkills() {
        const query = `
      SELECT * FROM skill_manifest
      ORDER BY created_at DESC
    `;
        return this.db.query(query);
    }
    // List available skills
    async listAvailableSkills() {
        const query = `
      SELECT * FROM skill_manifest
      WHERE is_available = 1
      ORDER BY created_at DESC
    `;
        return this.db.query(query);
    }
    // List locally modified skills
    async listModifiedSkills() {
        const query = `
      SELECT * FROM skill_manifest
      WHERE is_locally_modified = 1
      ORDER BY updated_at DESC
    `;
        return this.db.query(query);
    }
    // Mark skill as unavailable (404 error)
    async markUnavailable(skillId, reason) {
        const query = `
      UPDATE skill_manifest
      SET is_available = 0, updated_at = CURRENT_TIMESTAMP
      WHERE skill_id = ?
    `;
        await this.db.execute(query, [skillId]);
    }
    // Update last sync commit
    async updateLastSyncCommit(skillId, commit) {
        const query = `
      UPDATE skill_manifest
      SET last_sync_commit = ?, updated_at = CURRENT_TIMESTAMP
      WHERE skill_id = ?
    `;
        await this.db.execute(query, [commit, skillId]);
    }
    // Mark skill as locally modified
    async markLocallyModified(skillId) {
        const query = `
      UPDATE skill_manifest
      SET is_locally_modified = 1,
          modification_count = modification_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE skill_id = ?
    `;
        await this.db.execute(query, [skillId]);
    }
    // Record a contribution PR
    async recordContribution(contrib) {
        const query = `
      INSERT INTO skill_contributions (
        skill_id, pr_number, pr_url, pr_branch,
        upstream_repo_url, status, contribution_type,
        contribution_description, change_summary,
        lines_added, lines_deleted, author, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const result = await this.db.execute(query, [
            contrib.skill_id,
            contrib.pr_number,
            contrib.pr_url,
            contrib.pr_branch,
            contrib.upstream_repo_url,
            contrib.status,
            contrib.contribution_type,
            contrib.contribution_description || null,
            contrib.change_summary || null,
            contrib.lines_added || null,
            contrib.lines_deleted || null,
            contrib.author,
            contrib.notes || null,
        ]);
        return result.insertId;
    }
    // Get contribution by skill + PR number
    async getContribution(skillId, prNumber) {
        const query = `
      SELECT * FROM skill_contributions
      WHERE skill_id = ? AND pr_number = ?
      LIMIT 1
    `;
        const rows = await this.db.query(query, [skillId, prNumber]);
        return rows.length > 0 ? rows[0] : null;
    }
    // List contributions for a skill
    async listContributions(skillId) {
        const query = `
      SELECT * FROM skill_contributions
      WHERE skill_id = ?
      ORDER BY created_at DESC
    `;
        return this.db.query(query, [skillId]);
    }
    // Update contribution status
    async updateContributionStatus(skillId, prNumber, status, notes) {
        const query = `
      UPDATE skill_contributions
      SET status = ?, status_updated_at = CURRENT_TIMESTAMP,
          last_checked_at = CURRENT_TIMESTAMP,
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE skill_id = ? AND pr_number = ?
    `;
        await this.db.execute(query, [status, notes || null, skillId, prNumber]);
    }
}
//# sourceMappingURL=manifest-service.js.map