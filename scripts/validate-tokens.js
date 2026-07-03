import fs from "fs";

const REQUIRED_TOKENS = [
  "--cic-color-bg",
  "--cic-color-surface",
  "--cic-color-surface-0",
  "--cic-color-border",
  "--cic-color-text",
  "--cic-color-text-muted",
  "--cic-color-accent",
  "--cic-color-danger",
  "--cic-space-2",
  "--cic-space-4",
  "--cic-space-6",
  "--cic-space-8",
  "--cic-space-12",
  "--cic-space-16",
  "--cic-space-24",
  "--cic-motion-duration-medium",
  "--cic-motion-ease",
  "--cic-panel-elevation",
  "--cic-panel-border",
];

const css = fs.readFileSync("rewrite-mcp/apps/control-plane/dashboard/src/design-system.css", "utf8");

let missing = [];

for (const token of REQUIRED_TOKENS) {
  if (!css.includes(token)) {
    missing.push(token);
  }
}

process.exit(missing.length > 0 ? 1 : 0);
