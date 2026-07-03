/**
 * PanelValidator — Runtime design system compliance enforcer
 *
 * Checks new panel registrations at mount time for CIC Gold Design System compliance.
 * Non-compliant panels are blocked from rendering and violations logged to the governance vault.
 *
 * Integration:
 *   1. Call `PanelValidator.validate(descriptor)` before mounting any panel.
 *   2. If `result.blocked`, throw or return null to suppress rendering.
 *   3. Violations are logged to the governance vault via VaultClient.
 */

import { VaultClient } from '../clients/VaultClient';
import { GovernanceKind } from '../types/GovernancePacket';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PanelDescriptor {
  /** Unique panel identifier */
  panelId: string;
  /** Display name for logging */
  panelName: string;
  /** Serialized JSX source string for static analysis (optional, from dev tooling) */
  sourceSnapshot?: string;
  /** CSS-in-JS style object dump for inspection (optional) */
  styleObject?: Record<string, string>;
  /** List of component import paths used by this panel */
  importedComponents?: string[];
  /** Author/agent ID that generated this panel */
  authorId?: string;
}

export interface ValidationViolation {
  rule: string;
  severity: 'warn' | 'block';
  detail: string;
}

export interface ValidationResult {
  panelId: string;
  passed: boolean;
  /** If true, the panel must NOT be rendered */
  blocked: boolean;
  violations: ValidationViolation[];
  checkedAt: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Regex patterns for raw color values that indicate non-CIC token usage */
const HARDCODED_COLOR_PATTERNS: RegExp[] = [
  /#[0-9a-fA-F]{3,8}\b/,
  /\brgba?\s*\(/,
  /\bhsla?\s*\(/,
];

/** Expected CIC primitive import prefix */
const CIC_PRIMITIVES_PATH = 'cic-primitives';

/** Components that are specifically banned (raw HTML + styling) */
const BANNED_COMPONENT_PATTERNS: RegExp[] = [
  /^(div|span|section|article|main|aside|header|footer|nav)$/,
];

/** Required primitives: if a panel has zero CIC primitive imports, it's non-compliant */
const MIN_CIC_PRIMITIVE_IMPORTS = 1;

// ── PanelValidator ───────────────────────────────────────────────────────────

export class PanelValidator {
  constructor(private readonly vaultClient: VaultClient) {}

  /**
   * Validate a panel descriptor for CIC design system compliance.
   * Blocking violations prevent render. Warnings are logged but allowed.
   */
  async validate(descriptor: PanelDescriptor): Promise<ValidationResult> {
    const violations: ValidationViolation[] = [];

    // ── Rule 1: No hardcoded colors in style objects ────────────────────────
    if (descriptor.styleObject) {
      for (const [prop, value] of Object.entries(descriptor.styleObject)) {
        for (const pattern of HARDCODED_COLOR_PATTERNS) {
          if (pattern.test(value)) {
            violations.push({
              rule:     'NO_HARDCODED_COLORS',
              severity: 'block',
              detail:   `Style prop "${prop}" contains raw color value "${value}". Use CIC tokens from cic-primitives or cic-tokens.ts.`,
            });
          }
        }
      }
    }

    // ── Rule 2: No hardcoded colors in source snapshot ─────────────────────
    if (descriptor.sourceSnapshot) {
      for (const pattern of HARDCODED_COLOR_PATTERNS) {
        if (pattern.test(descriptor.sourceSnapshot)) {
          violations.push({
            rule:     'NO_HARDCODED_COLORS_SOURCE',
            severity: 'block',
            detail:   `Panel source contains raw color value matching ${pattern}. Use CIC tokens.`,
          });
        }
      }

      // ── Rule 3: No inline style= props ────────────────────────────────────
      if (/\bstyle\s*=\s*\{/.test(descriptor.sourceSnapshot)) {
        violations.push({
          rule:     'NO_INLINE_STYLES',
          severity: 'block',
          detail:   'Panel uses inline style= props. Replace with className + CIC token Tailwind classes.',
        });
      }
    }

    // ── Rule 4: Must import from cic-primitives ────────────────────────────
    if (descriptor.importedComponents !== undefined) {
      const cicImports = descriptor.importedComponents.filter(imp =>
        imp.includes(CIC_PRIMITIVES_PATH)
      );

      if (cicImports.length < MIN_CIC_PRIMITIVE_IMPORTS) {
        violations.push({
          rule:     'REQUIRES_CIC_PRIMITIVES',
          severity: 'block',
          detail:   `Panel imports zero CIC primitives. All panels must use components from "${CIC_PRIMITIVES_PATH}". Found imports: [${descriptor.importedComponents.join(', ') || 'none'}]`,
        });
      }

      // ── Rule 5: Warn on raw HTML element usage with likely styling ─────────
      const rawHtmlImports = descriptor.importedComponents.filter(imp =>
        BANNED_COMPONENT_PATTERNS.some(p => p.test(imp))
      );
      if (rawHtmlImports.length > 0) {
        violations.push({
          rule:     'PREFER_CIC_PRIMITIVES_OVER_RAW_HTML',
          severity: 'warn',
          detail:   `Panel uses raw HTML elements [${rawHtmlImports.join(', ')}]. Prefer CIC primitives (CICPanel, CICCard, CICGrid) for layout.`,
        });
      }
    }

    const blockingViolations = violations.filter(v => v.severity === 'block');
    const passed   = violations.length === 0;
    const blocked  = blockingViolations.length > 0;
    const checkedAt = new Date().toISOString();

    const result: ValidationResult = {
      panelId: descriptor.panelId,
      passed,
      blocked,
      violations,
      checkedAt,
    };

    // ── Log to governance vault ────────────────────────────────────────────
    if (!passed) {
      await this.logToVault(descriptor, result);
    }

    return result;
  }

  private async logToVault(descriptor: PanelDescriptor, result: ValidationResult): Promise<void> {
    const kind: GovernanceKind = 'amendment'; // closest semantic fit for a compliance record
    try {
      await this.vaultClient.write({
        kind,
        authorId: descriptor.authorId ?? 'system:panel-validator',
        payload: {
          panelId:    descriptor.panelId,
          panelName:  descriptor.panelName,
          blocked:    result.blocked,
          violations: result.violations,
          checkedAt:  result.checkedAt,
        },
        signals: ['ui-design-compliance'],
        metadata: {
          ruleSet: 'cic-gold-design-system-v1',
          version: '1.0.0',
          tags:    ['ui', 'design-compliance', result.blocked ? 'blocked' : 'warning'],
        },
      });
    } catch (_err) {
      // Vault logging failure must NOT prevent validation result from being returned.
      // Silently swallow — the validation result is still returned to the caller.
    }
  }
}
