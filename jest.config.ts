/** @type {import('ts-jest').JestConfigWithTsJest} */
process.env.TS_JEST_DISABLE_VER_CHECKER = "true";

module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  roots: ["<rootDir>/tests"], // ⚡ only source tests
  testMatch: ["**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  moduleNameMapper: {
    "^src$": "<rootDir>/src",
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(better-auth|@noble|@scure|jose)/)",
  ],
  verbose: true,
  detectOpenHandles: true,
};
