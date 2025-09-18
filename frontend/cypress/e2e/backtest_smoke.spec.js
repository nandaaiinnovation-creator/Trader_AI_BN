describe('Backtesting smoke', () => {
  it('runs a backtest and shows summary', () => {
    cy.visit('/')
    cy.contains('Backtesting').click()

    // If v2 controls are present, run v2; else run demo
    cy.window().then((win) => {
      const v2Flag = !!(win && (win.BACKTEST_V2_ENABLED === true))
      if (v2Flag) {
        // optional: sentiment toggle may exist; ignore failures
        cy.get('button').contains('Run Backtest').click({ force: true })
        cy.contains('Performance Summary', { timeout: 20000 })
      } else {
        cy.get('button').contains('Run Demo Backtest').click({ force: true })
        cy.contains('Summary', { timeout: 20000 })
      }
    })
  })
})
