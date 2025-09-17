import React from 'react'

export default function StatusBadge({ status, connected }){
  // Back-compat: allow passing `connected` boolean or a `status` string
  const st = typeof status === 'string'
    ? status
    : (connected === true ? 'connected' : connected === 'reconnecting' ? 'reconnecting' : 'disconnected')

  const style = {
    connected: { bg: '#e6ffed', fg: '#135200', text: 'Connected' },
    reconnecting: { bg: '#fffbe6', fg: '#613400', text: 'Reconnecting' },
    disconnected: { bg: '#fff1f0', fg: '#a8071a', text: 'Disconnected' },
  }[st] || { bg: '#f5f5f5', fg: '#555', text: String(st) }

  return (
    <span style={{background: style.bg, color: style.fg, border: '1px solid #eee', padding: '2px 8px', borderRadius: 12, fontSize: 12}}>
      {style.text}
    </span>
  )
}
