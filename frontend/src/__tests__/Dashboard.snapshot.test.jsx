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

test('Dashboard renders without crashing', async ()=>{
  const { container } = render(<Dashboard />)
  await waitFor(() => expect(container).toBeTruthy())
})
