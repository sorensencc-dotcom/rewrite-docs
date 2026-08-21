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
    "src/adapters/__tests__/BookStackAdapter\\.test\\.ts",
    "src/tests/BookStackAdapter\\.test\\.ts",
    "src/integration/bookstack\\.integration\\.test\\.ts",
    "cic-ingestion/src/tests/drift-detector\\.test\\.ts",
    "cic-ingestion/src/tests/adapter-integration\\.test\\.ts",
    "cic-ingestion/src/tests/six-rules-integration\\.test\\.ts",
    "cic-ingestion/src/ingestion/daemon-routing\\.test\\.ts",
    "cic-ingestion/src/ingestion/repairManifest\\.SixRules\\.test\\.ts",
    "cic-ingestion/tests/",
    "src/tests/phases-1-4-e2e\\.test\\.ts",
    "src/tests/optimization-phase-a\\.test\\.ts",
    "src/tests/phase5-operational\\.test\\.ts",
    "src/tests/dashboard-endpoints\\.test\\.ts",
    "src/tests/feedback-loop\\.test\\.ts",
    "src/tests/cic/phase8\\.integration\\.test\\.ts",
    "src/autonomy/routes/__tests__/firedrills-integration\\.test\\.ts",
    "src/autonomy/__tests__/phase-23-2-integration\\.test\\.ts",
    "src/autonomy/__tests__/e2e-test-harness\\.test\\.ts"
  ],
  moduleNameMapper: {
    "^uuid$": "uuid",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@maal/(.*)$": "<rootDir>/src/maal/$1",
    "^@vector/(.*)$": "<rootDir>/src/vector/$1",
    "^@learning/(.*)$": "<rootDir>/src/learning/$1",
    "^@wayland/(.*)$": "<rootDir>/src/wayland/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^((?:\\.{1,2}|src|cic|cic-ingestion)/.*)\\.js$": "$1",
    "\\.css$": "<rootDir>/jest-mock-css.js"
  },
  transform: {
    "^.+\\.(ts|tsx|js|jsx)$": ["ts-jest", {
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
