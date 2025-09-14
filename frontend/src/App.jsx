import React from 'react'
import Dashboard from './pages/Dashboard'

export default function App(){
  return (
    <div style={{fontFamily: 'sans-serif'}}>
      <header style={{padding: 12, borderBottom: '1px solid #eee'}}>
        <h1>BankNifty Signals — Dashboard (Minimal)</h1>
      </header>
      <main style={{padding: 12}}>
        <Dashboard />
      </main>
    </div>
  )
}
