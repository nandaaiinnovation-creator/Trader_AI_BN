// Export a plain config object so Cypress doesn't need to be available at
// Node `require` time. Some CI runners load the config in a separate
// process (Cypress binary) where the project `node_modules` may not yet
// be present, causing "Cannot find module 'cypress'" during config load.
// Keeping the file plain and dependency-free avoids that problem.

module.exports = {
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.spec.{js,ts}'
  }
}
