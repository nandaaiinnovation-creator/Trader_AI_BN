describe('Navigation and Settings', ()=>{
  it('navigates via NavBar and saves settings', ()=>{
    cy.visit('/')
    cy.contains('Backtesting').click()
    cy.contains('Backtesting').should('exist')

    cy.contains('Settings').click()
    cy.contains('Settings')

    // stub settings POST
    cy.intercept('POST','/api/settings', { statusCode: 200, body: { apiKeyMasked: 'sk_****abcd' } }).as('saveSettings')

    cy.get('input[placeholder="Enter API key or token"]').type('testkey123')
    cy.contains('Save').click()
    cy.wait('@saveSettings')
    cy.contains('Saved API key: sk_****abcd')
  })
})
