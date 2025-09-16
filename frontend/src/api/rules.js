export async function getRuleConfigs() {
  const res = await fetch('/api/rules/config');
  if (!res.ok) throw new Error('Failed to fetch rule configs');
  return res.json();
}

export async function upsertRuleConfig(name, body) {
  const res = await fetch(`/api/rules/config/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upsert failed: ${res.status} ${text}`);
  }
  return res.json();
}
