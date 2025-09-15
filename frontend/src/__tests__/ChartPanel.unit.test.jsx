import React from 'react'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
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

test('ChartPanel renders and has tooltip/legend elements', async ()=>{
  const props = {
    signals: [{ timestamp: Date.now(), score: 100, signal: 'BUY', symbol: 'BNF' }]
  }

  const { container } = render(<ChartPanel {...props} />)
  // smoke: ensure the root element renders
  const root = container.querySelector('.chart-panel') || container.firstChild
  expect(root).toBeTruthy()

  // legend should be present (overlay) - query by role/status
  const legend = container.querySelector('[role="status"]') || container.querySelector('[aria-live="polite"]')
  expect(legend).toBeTruthy()

  // tooltip exists but is hidden by default (query by role)
  const tooltip = container.querySelector('[role="tooltip"]') || container.getElementById('chart-tooltip')
  expect(tooltip).toBeTruthy()
  expect(tooltip.getAttribute('aria-hidden')).toBe('true')

  // simulate pointermove on the actual chart area (inner div) to reveal tooltip
  const chartArea = container.querySelector('.chart-panel > div') || root
  // provide a simple bounding rect so pointer math works in jsdom
  chartArea.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 })
  // wait a microtask so pointer handlers in effects are attached
  await new Promise(r => setTimeout(r, 0))
  act(()=>{
    // prefer mouseMove for jsdom; also dispatch a native PointerEvent as fallback
    fireEvent.mouseMove(chartArea, { clientX: 10, clientY: 10 })
    try {
      const ev = new PointerEvent('pointermove', { bubbles: true, clientX: 10, clientY: 10 })
      chartArea.dispatchEvent(ev)
    } catch (e) {}
  })
  // tooltip should now be visible (aria-hidden=false) — wait for the attribute to change
  await waitFor(() => {
    expect(tooltip.getAttribute('aria-hidden')).toBe('false')
  })

  // keyboard: focus the chart area and ensure tooltip is shown for last point
  act(()=>{ chartArea.focus() })
  await waitFor(()=> expect(tooltip.getAttribute('aria-hidden')).toBe('false'))
  // overlay legend should contain the series label and value
  await waitFor(()=> expect(legend.textContent).toMatch(/BNF/))
})

test('ChartPanel supports multiple series and renders legend items', async ()=>{
  const now = Date.now()
  const props = {
    signals: [
      { timestamp: now, score: 100, signal: 'BUY', symbol: 'BNF' },
      { timestamp: now - 1000, score: 80, signal: 'SELL', symbol: 'NIFTY' },
    ]
  }
  const { container } = render(<ChartPanel {...props} />)
  const root = container.querySelector('.chart-panel') || container.firstChild
  expect(root).toBeTruthy()
  const legend = container.querySelector('[role="status"]')
  expect(legend).toBeTruthy()

  // wait for legend items to be populated (labels present)
  await waitFor(()=> expect(legend.textContent).toMatch(/BNF/))
  await waitFor(()=> expect(legend.textContent).toMatch(/NIFTY/))

  // focus the chart area to ensure keyboard shows the tooltip and legend updates
  const chartArea = container.querySelector('.chart-panel > div') || root
  chartArea.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 })
  act(()=>{ chartArea.focus() })
  const tooltip = container.querySelector('[role="tooltip"]')
  await waitFor(()=> expect(tooltip.getAttribute('aria-hidden')).toBe('false'))
  // aria-labels on legend items are present for each series
  const items = container.querySelectorAll('[aria-label*="value"]')
  expect(items.length).toBeGreaterThanOrEqual(2)
})
