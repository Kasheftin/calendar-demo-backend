import config from '../config'

export function prepareRule (rule) {
  const out = {id: parseInt(rule.id) || null, type: rule.type, from: parseInt(rule.from) || null, to: parseInt(rule.to) || null}
  const ruleConfig = config.ruleTypes[rule.type]
  if (ruleConfig) {
    if (ruleConfig.valueType === 'integer') {
      out.value = parseInt(rule.value) || null
    } else if (ruleConfig.valueType === 'string') {
      out.value = rule.value.toString()
    }
    out.dbValue = out.value
    if (ruleConfig.type === 'select' && ruleConfig.options) {
      out.value = ruleConfig.options.find(option => option.id === out.value) || null
    }
  }
  return out
}

export function prepareTimeblocks (rules) {
  const timeblockRules = (rules || []).reduce((out, rule) => {
    if (!out.hasOwnProperty(rule.timeblock_id)) {
      out[rule.timeblock_id] = {
        id: rule.timeblock_id,
        rules: []
      }
    }
    out[rule.timeblock_id].rules.push(prepareRule(rule))
    return out
  }, {})
  return Object.values(timeblockRules).map(timeblock => {
    timeblock.rules.forEach(rule => {
      timeblock[rule.type] = rule.value
    })
    delete timeblock.rules
    return timeblock
  })
}

export default {
  prepareRule,
  prepareTimeblocks
}
