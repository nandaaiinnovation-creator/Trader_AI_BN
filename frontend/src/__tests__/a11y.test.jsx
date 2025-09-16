import React from 'react'
import { render } from '@testing-library/react'
let toHaveNoViolations
let axe
try {
  // optional devDependency; tests should not hard-fail if not installed
  // eslint-disable-next-line global-require
  const mod = require('jest-axe')
  toHaveNoViolations = mod.toHaveNoViolations || (mod.default && mod.default.toHaveNoViolations)
  axe = mod.axe || mod.default && mod.default.axe
} catch (e) {
  // leave undefined and skip the test below
}
import Dashboard from '../pages/Dashboard'

if (!axe || !toHaveNoViolations) {
  test.skip('Dashboard basic accessibility smoke (jest-axe) - skipped (jest-axe not installed)', ()=>{})
} else {
  expect.extend({ toHaveNoViolations })
  test('Dashboard basic accessibility smoke (jest-axe)', async ()=>{
    const { container } = render(<Dashboard />)
    const results = await axe(container)
    if (results.violations && results.violations.length){
      const fs = require('fs')
      fs.writeFileSync('axe-report.json', JSON.stringify(results.violations, null, 2))
    }
    const critical = (results.violations || []).filter(v => v.impact === 'critical')
    expect(critical.length).toBe(0)
  })
}
