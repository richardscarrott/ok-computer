module.exports = {
  displayName: {
    color: 'blue',
    name: 'types'
  },
  runner: 'jest-runner-tsd',
  testMatch: ['<rootDir>/src/**/*.test-d.ts'],
  testTimeout: 10000
};
