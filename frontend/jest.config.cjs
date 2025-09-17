module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./src/setupTests.js'],
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  moduleNameMapper: {
    '^.+\\.(css|less|scss|sass)$': '<rootDir>/jest-css-stub.js'
  },
  testMatch: ['**/src/**/__tests__/**/*.test.(js|jsx|ts|tsx)', '**/src/**/?(*.)+(spec|test).(js|jsx|ts|tsx)'],
};
