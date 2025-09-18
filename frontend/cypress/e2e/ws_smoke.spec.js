// WebSocket smoke: relies on Demo Mode emitting signals via socket.io in the app
// Asserts connection and reception of at least one signal-driven UI update

describe('WebSocket smoke (Demo Mode)', () => {
  it('connects and reflects incoming signal on Dashboard', () => {
    cy.visit('/')
    cy.get('[role="status"]').should('exist')
    // We expect the event list to update soon in demo mode; look for Recent signals list to gain a row
    cy.contains('Recent signals')
    // Assert that at least one recent signal item appears within a generous timeout
    cy.get('.bn-recent-list li', { timeout: 20000 }).should('have.length.greaterThan', 0)
  })
})
