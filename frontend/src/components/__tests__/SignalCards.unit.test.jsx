import React from 'react'
import { render, screen } from '@testing-library/react'
import SignalCards from '../SignalCards'

test('SignalCards shows placeholders when empty', ()=>{
  render(<SignalCards signals={[]} />)
  expect(screen.getAllByText(/No recent signal/i).length).toBeGreaterThan(0)
})

test('SignalCards displays latest per timeframe', ()=>{
  const signals = [
    { symbol: 'BN1', signal: 'BUY', score: 0.8, timestamp: new Date().toISOString(), timeframe: '3m', rule_name: 'rule A' },
    { symbol: 'BN2', signal: 'SELL', score: 0.4, timestamp: new Date().toISOString(), timeframe: '5m', rule_name: 'rule B' },
    { symbol: 'BN3', signal: 'BUY', score: 0.9, timestamp: new Date().toISOString(), timeframe: '15m', rule_name: 'rule C' }
  ]
  render(<SignalCards signals={signals} />)
  expect(screen.getByText('BN1')).toBeInTheDocument()
  expect(screen.getByText('BN2')).toBeInTheDocument()
  expect(screen.getByText('BN3')).toBeInTheDocument()
})
