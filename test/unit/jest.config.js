module.exports = {
  name: 'unit',
  displayName: 'Unit Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      tsConfig: './test/tsconfig.json'
    }
  },
  testTimeout: 5000,
  roots: ['./']
};
