import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import RulesPanel from '../components/RulesPanel'

jest.mock('../api/rules', ()=>({
  __esModule: true,
  getRuleConfigs: jest.fn().mockResolvedValue({ data: [{ name: 'r1', enabled: true, config: {} }] }),
  upsertRuleConfig: jest.fn().mockImplementation((name, payload)=> Promise.resolve({ data: { name, ...payload } }))
}))
jest.mock('socket.io-client')

test('toggles rule optimistically and reconciles on success', async ()=>{
  const { getByText } = render(<RulesPanel />)
  // wait for rule to show
  await waitFor(()=> expect(getByText('r1')).toBeTruthy())
  const button = getByText('Disable')
  fireEvent.click(button)
  // optimistic change should show "Enable" quickly
  await waitFor(()=> expect(getByText('Enable')).toBeTruthy())
})

test('rolls back optimistic change on failure', async ()=>{
  // make upsert fail
  const api = require('../api/rules')
  api.upsertRuleConfig.mockImplementationOnce(()=> Promise.reject(new Error('fail')))
  const { getByText } = render(<RulesPanel />)
  await waitFor(()=> expect(getByText('r1')).toBeTruthy())
  const button = getByText('Disable')
  fireEvent.click(button)
  // optimistic update shows 'Enable' first
  await waitFor(()=> expect(getByText('Enable')).toBeTruthy())
  // after failure, it should rollback to 'Disable'
  await waitFor(()=> expect(getByText('Disable')).toBeTruthy())
})
