module.exports = ({express, sequelize, uniqid, config, Rule, throwError, throwIf, catchError, sendError, sendSuccess, prepareTimeblocks, prepareRule, processNewRule}) => {
  const routes = express.Router()

  routes.get('/options', (req, res) => {
    sendSuccess(res, 'Calendar options extracted.')(config.ruleTypes)
  })

  routes.post('/init', async (req, res) => {
    try {
      const calendar_id = uniqid()
      if (req.body.type === 'copy-dance-seed') {
        await sequelize
        .query(
          'insert into `rules`(`calendar_id`, `timeblock_id`, `type`, `value`, `from`, `to`, `created_at`, `updated_at`) ' +
          'select :calendar_id, `timeblock_id`, `type`, `value`, `from`, `to`, NOW(), NOW() from `rules` where calendar_id=:id',
          {replacements: {calendar_id, id: 'dance-seed'}})
        .then(result => sendSuccess(res, 'Dance Seed Copied')({calendar_id}), throwError(500, 'sequelize error'))
      } else if (req.body.type === 'empty') {
        sendSuccess(res, 'New Empty Calendar Created')({calendar_id})
      } else throwError(400, 'bad request', 'action is not supported.')()
    } catch (error) {
      catchError(res, error)
    }
  })

  routes.get('/timeblocks', async (req, res) => {
    try {
      if (!req.query.calendar_id) throwError(400, 'bad request', '`calendar_id` field is essential.')()
      const calendar_id = req.query.calendar_id
      if (!req.query.week || !/^\d{6}$/.test(req.query.week)) throwError(400, 'bad request', '`week` field is essential in format YYYYWW.')()
      const week = parseInt(req.query.week)
      const statuses = [1]
      if (req.query.showClosedBlocks === 'true') statuses.push(2)
      if (req.query.showTemporaryClosedBlocks === 'true') statuses.push(3)
      const statusRules = await Rule
        .findAll({
          attributes: ['timeblock_id'],
          where: {
            calendar_id,
            from: {$or: [{$lte: week}, null]},
            to: {$or: [{$gte: week}, null]},
            type: 'status',
            value: {$in: statuses}
          }
        })
      if (!statusRules.length) return sendSuccess(res, 'Calendar data extracted, no data accordingly to status rule.')([])
      await Rule
        .findAll({
          where: {
            calendar_id,
            from: {$or: [{$lte: week}, null]},
            to: {$or: [{$gte: week}, null]},
            timeblock_id: {$in: statusRules.map(rule => rule.timeblock_id)}
          }
        })
        .then(prepareTimeblocks, throwError(500, 'sequelize error'))
        .then(sendSuccess(res, 'Calendar data extracted.'))
    } catch (error) {
      catchError(res, error)
    }
  })

  routes.post('/timeblocks', async (req, res) => {
    try {
      if (!req.body.calendar_id) throwError(400, 'bad request', '`calendar_id` field is essential.')()
      if (/-seed$/.test(req.body.calendar_id)) throwError(400, 'bad request', 'Seed data editing disabled.')()
      const calendar_id = req.body.calendar_id
      if (!req.body.from || !/^\d{6}$/.test(req.body.from)) throwError(400, 'bad request', '`from` field is essential in format YYYYWW')()
      const timeblock_id = await sequelize
        .query('select max(`timeblock_id`) as `id` from `rules` where calendar_id=:calendar_id limit 1', {replacements: {calendar_id}, type: sequelize.QueryTypes.SELECT})
        .then(rows => (rows.length ? rows[0].id + 1 : 1), throwError(500, 'sequelize error'))
      const rules = []
      Object.keys(config.ruleTypes).forEach(type => {
        if (!req.body[type] && config.ruleTypes[type].required) throwError(400, 'bad request', `${type} field is essential.`)()
        rules.push({
          calendar_id,
          timeblock_id,
          type,
          value: req.body[type] || '',
          from: req.body.from,
          to: req.body.to
        })
      })
      await Rule
        .bulkCreate(rules)
        .catch(throwError(500, 'sequelize error'))
      sendSuccess(res, 'New timeblock created.')()
    } catch (error) {
      catchError(res, error)
    }
  })

  routes.patch('/timeblocks/:id(\\d+)', async (req, res) => {
    try {
      const rules = []
      const ruleTypes = {}
      if (!req.body.calendar_id) throwError(400, 'bad request', '`calendar_id` field is essential.')()
      if (/-seed$/.test(req.body.calendar_id)) throwError(400, 'bad request', 'Seed data editing disabled.')()
      const calendar_id = req.body.calendar_id
      if (!req.body.rules || !Array.isArray(req.body.rules) || !req.body.rules.length) throwError(400, 'bad request', '`rules` array parameter is expected.')()
      req.body.rules.forEach(rule => {
        if (!rule.type || !config.ruleTypes[rule.type]) throwError(400, 'bad request', 'Rule `type` field is invalid.')()
        if (!rule.from || !/^\d{6}$/.test(rule.from)) throwError(400, 'bad request', 'Rule `from` field is essential in format YYYYWW.')()
        if (rule.to && !/^\d{6}$/.test(rule.to)) throwError(400, 'bad request', 'Rule `to` field must either be null or have YYYYWW format.')()
        rule = prepareRule(rule)
        if (rule.value === null) throwError(400, 'bad request', '`value` field is invalid.')()
        rules.push({...rule, value: rule.dbValue, timeblock_id: req.params.id})
        ruleTypes[rule.type] = true
      })
      const initialRules = await Rule
        .findAll({
          where: {
            calendar_id,
            timeblock_id: req.params.id,
            type: {$in: Object.keys(ruleTypes)}
          }
        }).then(rws => rws.reduce((out, rw) => {
          if (!out[rw.type]) out[rw.type] = []
          const rule = prepareRule(rw)
          out[rw.type].push({...rule, value: rule.dbValue})
          return out
        }, {}), throwError(500, 'sequelize error'))
      const promises = []
      rules.forEach(rule => {
        const actions = processNewRule(rule, initialRules[rule.type] || [])
        actions.forEach(action => {
          if (action.type === 'delete') {
            promises.push(Rule.destroy({
              where: {
                id: action.id
              }
            }))
          } else if (action.type === 'update') {
            promises.push(Rule.update(action.data, {
              where: {
                id: action.id
              }
            }))
          } else if (action.type === 'insert') {
            promises.push(Rule.build({...action.data, calendar_id, timeblock_id: rule.timeblock_id, type: rule.type}).save())
          }
        })
      })
      Promise.all(promises).then(result => sendSuccess(res, 'Timeblock rules updated.')())
    } catch (error) {
      catchError(res, error)
    }
  })

  return routes
}
