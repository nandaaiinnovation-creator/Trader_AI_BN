import React, { useState } from 'react'

export default function ApiKeyField({ onSave, saving }){
  const [val, setVal] = useState('')
  const [visible, setVisible] = useState(false)

  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <label style={{fontSize:13}}>API Key / Token</label>
      <div style={{display:'flex', gap:8}}>
        <input
          value={val}
          onChange={e=>setVal(e.target.value)}
          type={visible ? 'text' : 'password'}
          style={{flex:1, padding:8, borderRadius:6, border:'1px solid #ddd'}}
          placeholder="Enter API key or token"
        />
        <button type="button" onClick={()=>setVisible(v=>!v)} style={{padding:'8px 10px'}}>{visible ? 'Hide' : 'Show'}</button>
        <button type="button" disabled={saving || !val} onClick={()=> onSave && onSave(val)} style={{padding:'8px 10px'}}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
      <div style={{fontSize:12, color:'#666'}}>Note: keys are sent to the server for secure storage. Backend must handle encryption and access controls.</div>
    </div>
  )
}
