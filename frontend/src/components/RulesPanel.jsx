import React, {useEffect, useState} from 'react'

export default function RulesPanel(){
  const [rules, setRules] = useState([])

  useEffect(()=>{
    fetch('/api/rules/config')
      .then(r=>r.json())
      .then(j=> setRules(j.data || []))
      .catch(()=>{})
  },[])

  return (
    <div>
      <h3>Rules</h3>
      <ul>
        {rules.map((r, i)=> (
          <li key={i}>
            <strong>{r.name}</strong> — {r.enabled ? 'enabled' : 'disabled'}
          </li>
        ))}
      </ul>
    </div>
  )
}
