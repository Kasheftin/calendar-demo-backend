
/**
  * Each rule is {id, from, to, value} object;
  * New rule is {from, to, value} object;
  * from, to are numbers either null that represent week number in YYYYWW format;
  * if `from` is null, it counts as -infinity;
  * if `to` is null, it counts as +infinity;
  * value is anything that may be compared using === (strings, numbers, be careful about floats);
  * incomming initial rules should not overlap;
  * Output is an array of actions like [{type: 'update', id, data: {from: newFrom, to: newTo, value: newValue}}, {type: 'insert', data: {from, to, value}}];
  */

const rulesOverlap = (rule1, rule2) => {
  if (rule1.from === null && rule2.from === null) return true
  if (rule1.from === null) return (rule1.to === null || rule1.to >= rule2.from)
  if (rule2.from === null) return (rule2.to === null || rule2.to >= rule2.from)
  if (rule1.from <= rule2.from && (rule1.to === null || rule1.to >= rule2.from)) return true
  if (rule2.from <= rule1.from && (rule2.to === null || rule2.to >= rule1.from)) return true
  return false
}

const rulesNear = (rule1, rule2) => {
  if (rule1.from !== null && rule2.to !== null && rule1.from === rule2.to + 1) return true
  if (rule2.from !== null && rule1.to !== null && rule2.from === rule1.to + 1) return true
  return false
}

const compareFrom = (value1, value2) => {
  if (value1 === null && value2 === null) return 0
  if (value1 === null) return -1
  if (value2 === null) return 1
  return value1 - value2
}

const compareTo = (value1, value2) => {
  if (value1 === null && value2 === null) return 0
  if (value1 === null) return 1
  if (value2 === null) return -1
  return value1 - value2
}

const compareValue = (value1, value2) => {
  return value1 === value2
}

const processNewRule = (newRule, initialRules, debug) => {
  newRule = {...newRule}
  // 1. Select only actual rules and sort them by `from`;
  const rules = initialRules.filter(rule => rulesOverlap(rule, newRule) || rulesNear(rule, newRule)).sort((rule1, rule2) => compareFrom(rule1.from, rule2.from))
  if (debug) console.log(rules)
  // 2. If there're no rules, return new rule insert;
  if (rules.length === 0) return [{type: 'insert', data: newRule}]
  const firstRule = rules[0]
  const secondRule = rules[1]
  const lastRule = rules[rules.length - 1]
  // 3. Check if initialRules array consists of one rule that strictly covers newRule entirely;
  if (compareFrom(newRule.from, firstRule.from) > 0 && compareTo(newRule.to, firstRule.to) < 0) {
    if (compareValue(newRule.value, firstRule.value)) return []
    return [{type: 'update', id: firstRule.id, data: {to: newRule.from - 1}}, {type: 'insert', data: newRule}, {type: 'insert', data: {from: newRule.to + 1, to: firstRule.to, value: firstRule.value}}]
  }
  // 4. Check if first or second rule exactly matches the newRule;
  if (compareFrom(newRule.from, firstRule.from) === 0 && compareTo(newRule.to, firstRule.to) === 0) {
    if (compareValue(newRule.value, firstRule.value)) return []
    // return [{type: 'update', id: firstRule.id, data: {value: newRule.value}}]
  }
  if (rules.length > 1 && compareFrom(newRule.from, secondRule.from) === 0 && compareTo(newRule.to, secondRule.to) === 0) {
    if (compareValue(newRule.value, secondRule.value)) return []
    // return [{type: 'update', id: secondRule.id, data: {value: newRule.value}}]
  }

  const out = []
  if (compareFrom(newRule.from, firstRule.from) > 0) {
    if (compareValue(newRule.value, firstRule.value)) {
      newRule.from = firstRule.from
    } else if (firstRule.to !== newRule.from - 1) {
      out.push({type: 'update', id: firstRule.id, data: {to: newRule.from - 1}})
    }
  }
  if (compareTo(newRule.to, lastRule.to) < 0) {
    if (compareValue(newRule.value, lastRule.value)) {
      newRule.to = lastRule.to
    } else if (lastRule.from !== newRule.to + 1) {
      out.push({type: 'update', id: lastRule.id, data: {from: newRule.to + 1}})
    }
  }
  rules.forEach(rule => {
    if (compareFrom(newRule.from, rule.from) <= 0 && compareTo(newRule.to, rule.to) >= 0) {
      out.push({type: 'delete', id: rule.id})
    }
  })
  out.push({type: 'insert', data: newRule})
  const operationOrder = {delete: 1, update: 2, insert: 3}
  return out.sort((op1, op2) => operationOrder[op1.type] - operationOrder[op2.type])
}

export default {
  rulesOverlap,
  processNewRule
}
