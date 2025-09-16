describe('Dashboard smoke', ()=>{
  it('loads the dashboard and shows chart area and legend', ()=>{
    cy.visit('/')
    cy.get('.chart-panel').should('exist')
    cy.get('[role="status"]').should('exist')
  })
})
