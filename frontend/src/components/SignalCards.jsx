import React, { useMemo } from 'react'

function normalizeTimeframe(ev){
  if (!ev) return null
  const tf = ev.timeframe || ev.tf || ev.interval || ev.rule_timeframe || ev.timeframeMinutes
  if (!tf) {
    const rn = (ev.rule_name || '').toLowerCase()
    if (rn.includes('3m')) return '3m'
    if (rn.includes('5m')) return '5m'
    if (rn.includes('15m')) return '15m'
    return null
  }
  // normalize numeric minutes
  if (typeof tf === 'number') return tf === 3 ? '3m' : tf === 5 ? '5m' : tf === 15 ? '15m' : `${tf}m`
  const s = String(tf).toLowerCase()
  if (s === '3' || s === '3m') return '3m'
  if (s === '5' || s === '5m') return '5m'
  if (s === '15' || s === '15m') return '15m'
  return s
}

function fmtConv(ev){
  if (!ev) return '—'
  const val = ev.score ?? ev.conviction ?? ev.confidence ?? ev.confidence_pct
  if (val == null) return '—'
  const num = Number(val)
  if (Number.isNaN(num)) return String(val)
  // if in 0..1 range, show percent
  if (num > 0 && num <= 1) return `${Math.round(num * 100)}%`
  if (num >= 0 && num <= 100) return `${Math.round(num)}%`
  return String(num)
}

export default function SignalCards({ signals = [], selectedTF }){
  const tfMap = useMemo(()=>{
    const map = { '3m': null, '5m': null, '15m': null }
    for (let i=0;i<signals.length;i++){
      const ev = signals[i]
      const tf = normalizeTimeframe(ev)
      if (!tf) continue
      if (!map[tf]) map[tf] = ev
      else {
        // prefer newer timestamp if available
        const a = map[tf]
        try{
          const ta = new Date(a.timestamp || a.ts || a.time || 0).getTime() || 0
          const tb = new Date(ev.timestamp || ev.ts || ev.time || 0).getTime() || 0
          if (tb >= ta) map[tf] = ev
        }catch(e){ map[tf] = ev }
      }
    }
    return map
  }, [signals])

  const card = (tf)=>{
    const ev = tfMap[tf]
    const selected = selectedTF === tf
    return (
      <div key={tf} style={{flex:1, minWidth:160, border: selected ? '2px solid var(--bn-accent)' : '1px solid #eee', padding:12, borderRadius:6, background: selected ? 'rgba(0,120,212,0.03)' : '#fff'}}>
        <div style={{fontSize:12, color:'#666'}}>{tf.toUpperCase()}</div>
        {ev ? (
          <div style={{marginTop:8}}>
            <div style={{fontWeight:700}}>{ev.symbol || ev.ticker || ev.instrument || '—'}</div>
            <div style={{marginTop:6}}>
              <span style={{fontSize:14, fontWeight:600}}>{ev.signal || ev.side || '—'}</span>
              <span style={{marginLeft:8, color:'#666'}}>{fmtConv(ev)}</span>
            </div>
            <div style={{marginTop:8, fontSize:12, color:'#777'}}>{ev.rule_name || ev.rule || '—'}</div>
            <div style={{marginTop:6, fontSize:11, color:'#999'}}>{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'now'}</div>
          </div>
        ) : (
          <div style={{marginTop:8, color:'#999'}}>No recent signal</div>
        )}
      </div>
    )
  }

  return (
    <div style={{display:'flex', gap:12, marginTop:12}} aria-live="polite">
      {card('3m')}
      {card('5m')}
      {card('15m')}
    </div>
  )
}
