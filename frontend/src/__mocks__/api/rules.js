// Manual mock for api/rules used in tests
async function getRuleConfigs(){
  return { data: [] }
}

async function upsertRuleConfig(name, payload){
  return { data: { name, ...payload } }
}

module.exports = { getRuleConfigs, upsertRuleConfig, default: { getRuleConfigs, upsertRuleConfig } }
