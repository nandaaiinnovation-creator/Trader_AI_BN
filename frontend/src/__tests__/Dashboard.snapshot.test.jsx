import React from 'react'
import { render, waitFor } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'

// Provide an explicit mock so imported named functions return Promises
jest.mock('../api/rules', () => ({
  __esModule: true,
  getRuleConfigs: jest.fn().mockResolvedValue({ data: [] }),
  upsertRuleConfig: jest.fn().mockImplementation((name, payload) => Promise.resolve({ data: { name, ...payload } })),
}))
jest.mock('socket.io-client')

test('Dashboard snapshot', async ()=>{
  // ensure api returns no events and no rules quickly
  const { container } = render(<Dashboard />)
  // wait for any async effects to settle
  await waitFor(() => {
    // no-op assertion just to wait for effects
    expect(container).toBeTruthy()
  })
  expect(container).toMatchSnapshot()
})
