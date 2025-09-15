export async function getRuleConfigs(){
  // Simple wrapper around fetch — returns { data: [...] }
  try{
    const res = await fetch('/api/rules')
    const json = await res.json()
    return { data: json }
  } catch (err){
    return { data: [] }
  }
}

export async function upsertRuleConfig(name, payload){
  try{
    const res = await fetch(`/api/rules/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()
    return { data: json }
  } catch (err){
    throw err
  }
}
