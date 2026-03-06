// jest.config.js — plain JS avoids the ts-node requirement for TypeScript config files.
// All functionality is identical to the previous jest.config.ts.
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
  },
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 50,
      branches: 50,
    },
  },
};

module.exports = createJestConfig(config);
