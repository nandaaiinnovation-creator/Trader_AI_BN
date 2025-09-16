import React, {useEffect, useState, useRef} from 'react'
import { io } from 'socket.io-client'
import { getRuleConfigs, upsertRuleConfig } from '../api/rules'

export default function RulesPanel(){
  const [rules, setRules] = useState([])
  const socketRef = useRef(null)

  useEffect(()=>{
    let mounted = true
    getRuleConfigs()
      .then(j=> { if (mounted) setRules(j.data || []) })
      .catch(()=>{})

    const socket = io(undefined, { path: '/socket.io' })
    socketRef.current = socket
    socket.on('rule_config_updated', (cfg)=>{
      // reconcile: replace or insert the config
      setRules(prev => {
        const idx = prev.findIndex(p=>p.name === cfg.name)
        if (idx === -1) return [cfg, ...prev]
        const copy = [...prev]
        copy[idx] = cfg
        return copy
      })
    })

    return ()=>{
      mounted = false
      if (socketRef.current) socketRef.current.disconnect()
    }
  },[])

  const toggle = async (rule) => {
    // optimistic update
    const original = rules
    setRules(prev => prev.map(r=> r.name===rule.name ? {...r, enabled: !r.enabled} : r))
    try {
      const j = await upsertRuleConfig(rule.name, { enabled: !rule.enabled, config: rule.config || {} })
      // reconcile with authoritative server response
  setRules(prev => prev.map(r=> r.name===j.data.name ? j.data : r))
    } catch (err) {
      // rollback optimistic update on error
      setRules(original)
      // eslint-disable-next-line no-console
      console.error('Failed to toggle rule', err)
    }
  }

  return (
    <div>
      <h3>Rules</h3>
      <ul>
        {rules.map((r, i)=> (
          <li key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <strong>{r.name}</strong>
              <div style={{fontSize:12, color:'#666'}}> {r.enabled ? 'enabled' : 'disabled'}</div>
            </div>
            <div>
              <button onClick={()=>toggle(r)}>{r.enabled ? 'Disable' : 'Enable'}</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
