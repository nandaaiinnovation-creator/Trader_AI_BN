export async function fetchSignals({ limit = 50, cursor } = {}){
  const u = new URL('/api/signals', window.location.origin)
  u.searchParams.set('limit', String(limit))
  if (cursor) u.searchParams.set('cursor', cursor)
  const res = await fetch(u.toString())
  if (!res.ok) throw new Error(`Failed to fetch signals: ${res.status}`)
  return res.json()
}
