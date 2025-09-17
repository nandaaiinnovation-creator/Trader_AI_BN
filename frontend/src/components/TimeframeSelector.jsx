import React from 'react'

const TF_OPTIONS = ['3m','5m','15m']

export default function TimeframeSelector({ value='5m', onChange }){
  return (
    <div style={{display:'flex', gap:8, alignItems:'center'}} role="tablist" aria-label="Timeframe selector">
      {TF_OPTIONS.map(tf=> (
        <button
          key={tf}
          onClick={()=> onChange && onChange(tf)}
          aria-pressed={value === tf}
          style={{
            padding: '6px 10px',
            borderRadius:6,
            border: value === tf ? '1px solid var(--bn-accent)' : '1px solid #eee',
            background: value === tf ? 'rgba(0,120,212,0.06)' : '#fff',
            cursor: 'pointer'
          }}
        >{tf}</button>
      ))}
    </div>
  )
}
