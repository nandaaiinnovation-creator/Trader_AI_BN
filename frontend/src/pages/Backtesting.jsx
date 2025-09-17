import React from 'react'

export default function Backtesting(){
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [summary, setSummary] = React.useState(null)
  const [v2Enabled, setV2Enabled] = React.useState(()=>{
    try { return (import.meta.env?.VITE_BACKTEST_V2_ENABLED === 'true') || (window?.BACKTEST_V2_ENABLED === true) } catch { return false }
  })
  const [timeframe, setTimeframe] = React.useState('5m')
  const [toggles, setToggles] = React.useState({
    global: true,
    groups: {
      'Price Action': true,
      'Momentum': true,
      'Trend': true,
      'Volatility': true,
      'Sentiment': true,
    }
  })

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

  const runV2 = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/backtest/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeframe, toggles }) })
      if(!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setSummary(json.data || null)
    } catch (e) {
      setError(e.message || 'Failed to run backtest v2')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{padding:20}}>
      <h2>Backtesting</h2>
      <p>Run a deterministic demo backtest to verify wiring. {v2Enabled ? 'Backtest v2 available.' : ''}</p>

      {v2Enabled && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:12, marginBottom:12}}>
          <div className="bn-card" style={{padding:12}}>
            <h4 style={{marginTop:0}}>Controls</h4>
            <div style={{marginBottom:8}}>
              <label>Timeframe: </label>
              <select value={timeframe} onChange={e=>setTimeframe(e.target.value)}>
                <option value="3m">3m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
              </select>
            </div>
            <div>
              <label style={{display:'flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={!!toggles.global} onChange={e=>setToggles(t=>({ ...t, global: e.target.checked }))} />
                <span>Enable all rules</span>
              </label>
              {Object.keys(toggles.groups).map(g => (
                <label key={g} style={{display:'flex', alignItems:'center', gap:6}}>
                  <input type="checkbox" checked={!!toggles.groups[g]} onChange={e=>setToggles(t=>({ ...t, groups: { ...t.groups, [g]: e.target.checked } }))} />
                  <span>{g}</span>
                </label>
              ))}
            </div>
            <div style={{marginTop:10}}>
              <button onClick={runV2} disabled={loading}>{loading ? 'Running…' : 'Run Backtest'}</button>
            </div>
          </div>
          <div className="bn-card" style={{padding:12}}>
            <h4 style={{marginTop:0}}>Performance Summary</h4>
            {summary?.overall ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px,1fr))', gap:8}}>
                <div><b>Win %</b><div>{(summary.overall.win_rate*100).toFixed(1)}%</div></div>
                <div><b>Profit Factor</b><div>{summary.overall.profit_factor.toFixed(2)}</div></div>
                <div><b>Expectancy</b><div>{summary.overall.expectancy.toFixed(2)}</div></div>
                <div><b>Max DD</b><div>{summary.overall.max_drawdown.toFixed(2)}</div></div>
                <div><b>Sharpe</b><div>{summary.overall.sharpe.toFixed(2)}</div></div>
                <div><b>PNL</b><div>{summary.overall.pnl.toFixed(2)}</div></div>
              </div>
            ) : <div>Run a backtest to see metrics.</div>}
            {summary?.groups && (
              <div style={{marginTop:12}}>
                <h5>Group Breakdown</h5>
                <table style={{width:'100%', fontSize:12}}>
                  <thead><tr><th align="left">Group</th><th>Win %</th><th>PF</th><th>PNL</th></tr></thead>
                  <tbody>
                    {Object.entries(summary.groups).map(([g, m]) => (
                      <tr key={g}><td>{g}</td><td style={{textAlign:'center'}}>{(m.win_rate*100).toFixed(1)}%</td><td style={{textAlign:'center'}}>{m.profit_factor.toFixed(2)}</td><td style={{textAlign:'right'}}>{m.pnl.toFixed(2)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {summary?.equity_curve && (
              <div style={{marginTop:12}}>
                <h5>Equity (simplified)</h5>
                <ul style={{maxHeight:160, overflow:'auto'}}>
                  {summary.equity_curve.map((p,i)=> <li key={i}>{new Date(p.time).toLocaleTimeString()} → {p.equity.toFixed(2)}</li>)}
                </ul>
              </div>
            )}
            {summary?.trades && (
              <div style={{marginTop:12}}>
                <h5>Trades</h5>
                <table style={{width:'100%', fontSize:12}}>
                  <thead><tr><th align="left">Time</th><th>Type</th><th>Entry</th><th>Exit</th><th>PNL</th><th align="left">Rules</th></tr></thead>
                  <tbody>
                    {summary.trades.map((t,i)=> (
                      <tr key={i}><td>{new Date(t.time).toLocaleTimeString()}</td><td style={{textAlign:'center'}}>{t.type}</td><td style={{textAlign:'right'}}>{t.price}</td><td style={{textAlign:'right'}}>{t.exit_price}</td><td style={{textAlign:'right'}}>{t.pnl.toFixed(2)}</td><td>{(t.rules_triggered||[]).join(', ')}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={runDemo} disabled={loading || v2Enabled}>
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
