import React from 'react'
import Dashboard from './pages/Dashboard'
import './styles/app.css'

export default function App(){
  return (
    <div>
      <header style={{padding: 12, borderBottom: '1px solid #eee', background: 'var(--bn-card-bg)'}}>
        <h1 style={{margin:0}}>BankNifty Signals — Dashboard</h1>
      </header>
      <main style={{padding: 12}}>
        <Dashboard />
      </main>
    </div>
  )
}
