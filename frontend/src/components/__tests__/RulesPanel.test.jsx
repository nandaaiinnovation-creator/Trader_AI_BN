import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock socket.io-client to provide an object with on/emit/disconnect
jest.mock('socket.io-client', () => ({
  io: () => ({
    on: jest.fn(),
    disconnect: jest.fn(),
  })
}))

// Mock the API wrapper used by RulesPanel
jest.mock('../../api/rules', () => ({
  getRuleConfigs: jest.fn(),
  upsertRuleConfig: jest.fn(),
}))

import { getRuleConfigs, upsertRuleConfig } from '../../api/rules'
import RulesPanel from '../RulesPanel'

describe('RulesPanel optimistic toggle', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('optimistically updates on toggle and reconciles on success', async () => {
    const rules = [{ name: 'r1', enabled: false, config: {} }]
    // initial GET
  getRuleConfigs.mockResolvedValue({ data: rules })
  upsertRuleConfig.mockResolvedValue({ data: { name: 'r1', enabled: true, config: {} } })

    render(<RulesPanel />)

    // wait for initial load
    await waitFor(() => expect(screen.getByText('r1')).toBeInTheDocument())
    expect(screen.getByText('disabled')).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /Enable/i })
    userEvent.click(btn)

  // optimistic: should show enabled (wait for state update)
  await waitFor(() => expect(screen.getByText('enabled')).toBeInTheDocument())

    // after server response it should reconcile (still enabled)
    await waitFor(() => expect(upsertRuleConfig).toHaveBeenCalledTimes(1))
    expect(screen.getByText('enabled')).toBeInTheDocument()
  })

  it('rolls back optimistic update on failure', async () => {
    const rules = [{ name: 'r2', enabled: true, config: {} }]
  getRuleConfigs.mockResolvedValue({ data: rules })
  // PUT fails
  upsertRuleConfig.mockRejectedValue(new Error('put failed'))

    render(<RulesPanel />)
    await waitFor(() => expect(screen.getByText('r2')).toBeInTheDocument())
    expect(screen.getByText('enabled')).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /Disable/i })
    userEvent.click(btn)

  // optimistic: show disabled
  await waitFor(() => expect(screen.getByText('disabled')).toBeInTheDocument())

  // after failure, rollback to original enabled state
  await waitFor(() => expect(upsertRuleConfig).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(screen.getByText('enabled')).toBeInTheDocument())
  })
})
