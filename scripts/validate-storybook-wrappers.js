import fs from "fs";

const REQUIRED_FILES = [
  "src/stories/cic/DensityWrapper.tsx",
  "src/stories/utils/DarkModeWrapper.tsx",
];

let missing = [];

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(file)) {
    missing.push(file);
  }
}

process.exit(missing.length > 0 ? 1 : 0);
