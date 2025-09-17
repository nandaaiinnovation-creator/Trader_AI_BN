import React from 'react'
import { getRuleConfigs, upsertRuleConfig } from '../api/rules'
import getSocket from '../lib/socket'

export default function RulesEngine(){
  const [rules, setRules] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState({})
  const [error, setError] = React.useState(null)
  const [toast, setToast] = React.useState(null)

  // Load initial configs
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const json = await getRuleConfigs()
        if (!mounted) return
        setRules((json && json.data) || [])
      } catch (e) {
        if (!mounted) return
        setError(e.message || 'Failed to load rules')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Listen for server ack when rules are applied
  React.useEffect(() => {
    const socket = getSocket()
    const handler = (payload) => {
      setToast(`Rules applied: ${payload?.name ?? 'updated'} (${payload?.enabled ? 'enabled' : 'disabled'})`)
      // auto-dismiss toast
      setTimeout(() => setToast(null), 2500)
    }
    socket.on('rules:applied', handler)
    return () => {
      socket.off('rules:applied', handler)
    }
  }, [])

  const updateField = (idx, field, value) => {
    setRules(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const onSave = async (idx) => {
    const r = rules[idx]
    setSaving(s => ({ ...s, [r.name]: true }))
    setError(null)
    try {
      await upsertRuleConfig(r.name, { enabled: !!r.enabled, config: r.config || {} })
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(s => ({ ...s, [r.name]: false }))
    }
  }

  if (loading) return <div style={{ padding: 20 }}>Loading…</div>

  return (
    <div style={{padding:20}}>
      <h2>Rules Engine</h2>
      <p>Toggle and tune rules. Changes persist and apply live.</p>

      {error && <div style={{color:'crimson', marginBottom:12}}>Error: {error}</div>}
      {toast && <div style={{background:'#e6ffed', border:'1px solid #b7eb8f', color:'#135200', padding:8, borderRadius:6, marginBottom:12}}>{toast}</div>}

      {rules.length === 0 && <div>No rules found.</div>}

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12}}>
        {rules.map((r, idx) => (
          <div key={r.id || r.name} style={{border:'1px solid #eee', borderRadius:8, padding:12}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600}}>{r.name}</div>
                <div style={{fontSize:12, color:'#666'}}>id: {r.id || '—'}</div>
              </div>
              <label style={{display:'flex', alignItems:'center', gap:6}}>
                <input type="checkbox" checked={!!r.enabled} onChange={e=>updateField(idx, 'enabled', e.target.checked)} />
                <span>Enabled</span>
              </label>
            </div>

            <div style={{marginTop:8}}>
              <label style={{display:'block', fontSize:12, color:'#666', marginBottom:4}}>Config (JSON)</label>
              <textarea
                value={JSON.stringify(r.config || {}, null, 2)}
                onChange={(e)=>{
                  try {
                    const val = JSON.parse(e.target.value || '{}')
                    updateField(idx, 'config', val)
                  } catch {
                    // ignore parse errors during typing; we don't block editing
                  }
                }}
                style={{width:'100%', minHeight:120, fontFamily:'monospace', fontSize:12}}
              />
            </div>

            <div style={{marginTop:10, display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button onClick={() => onSave(idx)} disabled={!!saving[r.name]}> {saving[r.name] ? 'Saving…' : 'Save'} </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
