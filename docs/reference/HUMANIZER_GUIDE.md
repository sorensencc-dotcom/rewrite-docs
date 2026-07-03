---
title: "HUMANIZER GUIDE"
summary: "# Humanizer PostProcessor - Operator Guide"
created: "2026-07-03T19:43:46.053Z"
updated: "2026-07-03T19:43:46.053Z"
tags:
  - cic
  - rewrite-labs
  - roadmap
---
# Humanizer PostProcessor - Operator Guide

## Overview

Humanizer is a deterministic text processing stage that removes AI writing patterns from CIC pipeline output. Uses rule-based transformations across 5 categories (content, language, style, communication, filler) with 9 production rules organized by confidence tier.

## Quick Start

### Basic Usage

```bash
cic run --humanize
```

Processes sample segments with default profile (Tier 1 only, 100% confidence).

### View Changes

```bash
cic run --diff
```

Shows before/after diffs for each edited segment.

### Profiles

| Profile | Rules | Use Case |
|---------|-------|----------|
| `default` | Tier 1 only | Safe mechanical transforms (em-dashes, quotes, case) |
| `rewrite-labs` | Tier 1 + Tier 2 | Full humanization (filler phrases, verbose verbs) |
| `custom` | User-selected | Granular control |

### Custom Profile

```bash
cic run --humanize --humanize-profile custom --humanize-tiers 1,2
```

Enables Tier 1 and Tier 2 rules only.

## Rules Reference

### Tier 1 (100% Confidence - Mechanical)

| Rule | ID | Category | Example |
|------|----|-----------| --------|
| Em-dash to comma | 14 | language | `text—here` → `text, here` |
| Curly quotes | 19 | language | `"text"` → `"text"` |
| Title case fix | 17 | style | `OVERVIEW` → `Overview` |
| Remove emojis | 18 | style | `📌 Section` → `Section` |
| Remove boldface | 15 | style | `**term**` → `term` |

### Tier 2 (85-95% Confidence - Pattern-Based)

| Rule | ID | Category | Example | Confidence |
|------|----|-----------| --------|-----------|
| Filler phrases | 23 | filler | `In order to` → `To` | 0.92 |
| Hyphenated pairs | 26 | language | `is high-quality` → `is high quality` | 0.88 |
| Verbose copulas | 8 | language | `serves as` → `is` | 0.90 |
| AI vocabulary | 7 | content | `Additionally` → `Also` | 0.80-0.88 |

## Configuration

### PostProcessorConfig Interface

```typescript
{
  enabled: boolean;                    // Enable/disable processor
  profile?: "default" | "rewrite-labs" | "custom";
  ruleTiers?: { tier1?: boolean; tier2?: boolean };
  dryRun?: boolean;                    // Record edits, don't apply
  confidenceThresholds?: {
    apply?: number;                    // Min confidence to apply (default 0.7)
  };
  voiceCalibration?: {
    preserve?: string[];               // Styles to keep (e.g., "casual")
    amplify?: string[];                // Styles to emphasize
  };
}
```

### Confidence Thresholds

Default: apply edits ≥ 0.70 confidence.

Set higher to be conservative:
```bash
# Would require --confidence-threshold flag (not yet implemented)
# For now, modify config in code
```

## Determinism Guarantee

Humanizer is **fully deterministic**: identical input always produces identical output across any number of runs.

Verified on startup via `isDeterministic(10)` check:
- Processes test segment 10 times
- Compares all outputs
- Warns if non-deterministic (would indicate a bug)

## Audit Trail

Each edit generates an `EditRecord`:

```typescript
{
  ruleId: number;              // Rule identifier
  ruleName: string;            // Human-readable name
  category: string;            // content|language|style|communication|filler
  before: string;              // Original text
  after: string;               // Replacement text
  confidence: number;          // 0.0-1.0
  lineNum: number;             // Line number in segment
  startOffset: number;         // Character offset
  endOffset: number;           // Character offset
}
```

Access via:
```typescript
postProcessor.getRulesApplied(segment)  // Returns EditRecord[]
segment.humanized.edits                 // After processing
```

## Integration Points

### In CIC Pipeline

```
Harvester → [PostProcessor: Humanizer] → Auditor → Synthesizer
```

- Enabled via `PostProcessorConfig` in pipeline config
- Processes `TextSegment` objects
- Updates segment.content with humanized text
- Populates segment.humanized with audit trail

### CLI Usage

```bash
cic run \
  --humanize \
  --humanize-profile rewrite-labs \
  --diff \
  --dry-run
```

Flags:
- `--humanize`: Enable processor
- `--humanize-profile`: Select profile
- `--humanize-tiers`: Comma-separated tier list (custom mode)
- `--diff`: Show before/after for each segment
- `--dry-run`: Record edits without modifying content

## Troubleshooting

### Non-deterministic Warning

If `isDeterministic()` returns false on startup:
1. **First occurrence**: Likely indicates a bug in rule implementation
2. **Action**: Check rule logic for randomness or state dependencies
3. **Report**: File issue with test case showing non-determinism

### Rules Not Applying

1. **Check enabled**: Verify `enabled: true` in config
2. **Check profile**: Confirm tier matches rule (see Rules Reference)
3. **Check threshold**: If edits have confidence < threshold, they're filtered
4. **Check dry-run**: Edits recorded but content unchanged if `dryRun: true`

### Missing Replacements

- Tier 1 rules are mechanical (regex/case transforms)
- Tier 2 rules use pattern matching (word boundaries, context)
- Custom voice calibration not yet implemented
- Semantic rules (Tier 3/4) not included

## Performance

- **Speed**: <10ms per 1000-word segment (depends on rule count)
- **Memory**: O(n) where n = text length
- **Determinism overhead**: ~1ms (10-iteration check on init)

## Security Notes

- No external API calls
- No network I/O
- No file system access
- Fully contained text transformation

## Future Work

- [ ] Tier 3/4 semantic rules (70-85% confidence)
- [ ] Voice calibration (style preservation/amplification)
- [ ] Confidence threshold CLI flag
- [ ] Per-rule enable/disable toggles
- [ ] Rule explanation (why rule fired)
