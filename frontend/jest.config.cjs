module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  testMatch: ['**/src/**/__tests__/**/*.test.(js|jsx|ts|tsx)', '**/src/**/?(*.)+(spec|test).(js|jsx|ts|tsx)'],
};
