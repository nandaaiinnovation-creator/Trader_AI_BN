import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import Backtesting from './pages/Backtesting'
import Sentiment from './pages/Sentiment'
import RulesEngine from './pages/RulesEngine'
import Settings from './pages/Settings'

export default function App(){
  return (
    <BrowserRouter>
      <div style={{fontFamily: 'sans-serif'}}>
        <header style={{padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h1 style={{margin:0}}>BankNifty Signals</h1>
          <NavBar />
        </header>
        <main style={{padding: 12}}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/sentiment" element={<Sentiment />} />
            <Route path="/rules" element={<RulesEngine />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
