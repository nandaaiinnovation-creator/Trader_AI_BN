import React from 'react'

export default function Backtesting(){
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [summary, setSummary] = React.useState(null)

  const runDemo = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/backtest/demo', { method: 'POST' })
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setSummary(json.data || null)
    } catch (e) {
      setError(e.message || 'Failed to run backtest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{padding:20}}>
      <h2>Backtesting</h2>
      <p>Run a deterministic demo backtest to verify wiring.</p>

      <button onClick={runDemo} disabled={loading}>
        {loading ? 'Running…' : 'Run Demo Backtest'}
      </button>

      {error && <div style={{color:'crimson', marginTop:12}}>Error: {error}</div>}

      {summary && (
        <div style={{marginTop:16, padding:12, border:'1px solid #ddd', borderRadius:8}}>
          <h3 style={{marginTop:0}}>Summary</h3>
          <div><b>Strategy:</b> {summary.strategy}</div>
          <div><b>Dataset:</b> {summary.dataset}</div>
          <div><b>Trades:</b> {summary.trades}</div>
          <div><b>Win Rate:</b> {summary.winRate}%</div>
          <div><b>PNL:</b> {summary.pnl}</div>
          <div><b>Avg R/R:</b> {summary.avgRR}</div>
          <div><b>Max DD:</b> {summary.maxDD}%</div>
          <div><b>Took:</b> {summary.durationSec}s</div>
          <div><b>Generated:</b> {new Date(summary.generatedAt).toLocaleString()}</div>
        </div>
      )}
    </div>
  )
}
