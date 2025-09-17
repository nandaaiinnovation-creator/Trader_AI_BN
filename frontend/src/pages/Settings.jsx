import React, { useEffect, useState } from 'react'
import ApiKeyField from '../components/ApiKeyField'

// Note: This is a minimal client-side settings form.
// Security notes:
// - Persisting API keys on the server should be done securely (encrypted at rest).
// - Authentication and CSRF protection should be enforced on the backend endpoints.
// - Avoid returning raw API keys in responses; prefer returning masked values or a status.

export default function Settings(){
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedKeyMasked, setSavedKeyMasked] = useState(null)

  useEffect(()=>{
    // Try to fetch existing settings (masked). Backend should return masked key if available.
    fetch('/api/settings')
      .then(r=> r.ok ? r.json() : Promise.reject(new Error('Failed to fetch')))
      .then(json=>{
        if (json && json.apiKeyMasked) setSavedKeyMasked(json.apiKeyMasked)
      }).catch(()=>{})
  },[])

  async function handleSave(key){
    setSaving(true); setError(null)
    try{
      // POST the API key to backend. Backend MUST authenticate and protect this endpoint.
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      })
      if (!res.ok) throw new Error('Save failed')
      const json = await res.json()
      setSavedKeyMasked(json.apiKeyMasked || '**** ****')
    }catch(err){
      setError(err.message || 'Failed to save')
    }finally{ setSaving(false) }
  }

  return (
    <div style={{padding:20}}>
      <h2>Settings</h2>
      <p>Manage API keys and preferences here.</p>

      <div style={{maxWidth:560}}>
        <ApiKeyField onSave={handleSave} saving={saving} />

        <div style={{marginTop:12}}>
          <div style={{fontSize:12, color:'#666'}}>Saved API key: {savedKeyMasked || <em style={{color:'#999'}}>None</em>}</div>
          {error && <div style={{marginTop:8, color:'#c62828'}}>Error: {error}</div>}
        </div>
      </div>
    </div>
  )
}
