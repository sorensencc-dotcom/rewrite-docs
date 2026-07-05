export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  roots: ["<rootDir>/src", "<rootDir>/cic", "<rootDir>/cic-runtime", "<rootDir>/cic-ingestion", "<rootDir>/cic-ui", "<rootDir>/cic-os"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  testPathIgnorePatterns: [
    "/cic-runtime/integration\\.test\\.ts",
    "/aperture/(sandbox|orchestrator|__tests__)/",
    "cic-ingestion/src/vector/__tests__",
    "cic-ingestion/src/wayland/__tests__",
    "cic-ingestion/src/autonomy/__tests__",
    "cic-ingestion/src/extractors/(browser|sweeper)",
    "src/tests/c-phase-routing\\.test\\.ts",
    "src/ui/console-v3/live-regions\\.test\\.tsx",
    "src/ui/console-v3/.*\\.a11y\\.test\\.ts",
    "src/tests/modelRegistry\\.test\\.ts",
    "src/tests/modelRouter\\.test\\.ts",
    "src/tests/fuguIntegration\\.test\\.ts",
    "src/tests/agentRouting\\.test\\.ts",
    "src/tests/auditCrossModel\\.test\\.ts",
    "src/tests/capabilities\\.test\\.ts",
    "src/tests/BookStackAdapter\\.test\\.ts",
    "src/integration/bookstack\\.integration\\.test\\.ts",
    "cic-ingestion/src/tests/drift-detector\\.test\\.ts",
    "cic-ingestion/tests/",
    "src/autonomy/__tests__/phase-23-2-integration.test.ts"
  ],
  moduleNameMapper: {
    "^uuid$": "uuid",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.css$": "<rootDir>/jest-mock-css.js"
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      useESM: true,
      isolatedModules: true,
      tsconfig: {
        module: "esnext",
        target: "esnext",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  transformIgnorePatterns: [
    "node_modules/(?!(uuid|@paralleldrive|@noble|cuid2|node-cron)/)"
  ],
  collectCoverageFrom: [
    "cic/src/**/*.ts",
    "!cic/src/**/*.test.ts",
    "!**/node_modules/**"
  ],
  testTimeout: 90000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  extensionsToTreatAsEsm: [".ts"]
};
