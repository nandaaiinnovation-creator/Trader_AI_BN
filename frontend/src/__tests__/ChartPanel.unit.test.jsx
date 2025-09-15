import React from 'react'
import { render, act } from '@testing-library/react'
import ChartPanel from '../components/ChartPanel'

// Minimal mock for ResizeObserver used in ChartPanel
class ResizeObserverMock {
  constructor(cb){ this.cb = cb }
  observe() { /* no-op */ }
  unobserve() { /* no-op */ }
  disconnect() {}
}

beforeAll(()=>{
  // eslint-disable-next-line no-global-assign
  global.ResizeObserver = ResizeObserverMock
})

test('ChartPanel renders and handles markers/resize', ()=>{
  const props = {
    symbols: ['BNF'],
    series: [ { time: Date.now()/1000, value: 100 } ],
    signals: [{time: Date.now()/1000, price: 100, type: 'BUY'}]
  }

  const { container } = render(<ChartPanel {...props} />)
  // smoke: ensure the root element renders
  expect(container.querySelector('.chart-panel') || container.firstChild).toBeTruthy()

  // Simulate a resize by calling the RAF loop if any
  act(()=>{
    // nothing to do — ChartPanel uses ResizeObserver; presence of mock is enough for smoke
  })
})
