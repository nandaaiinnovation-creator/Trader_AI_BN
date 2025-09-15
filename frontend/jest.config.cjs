module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    '^lightweight-charts$': '<rootDir>/src/__mocks__/lightweight-charts.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: ['**/src/**/__tests__/**/*.test.(js|jsx|ts|tsx)', '**/src/**/?(*.)+(spec|test).(js|jsx|ts|tsx)'],
};
