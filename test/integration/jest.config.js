module.exports = {
  name: 'integration',
  displayName: 'Integration Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsConfig: './test/tsconfig.json'
    }
  },
  globalSetup: './setup',
  globalTeardown: './teardown',
  setupFilesAfterEnv: ["./inbetween"],
  testTimeout: 30000,
  roots: ['./']
};
