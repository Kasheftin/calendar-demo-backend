import express from 'express'
import bodyParser from 'body-parser'
import sequelize from 'sequelize'
import uniqid from 'uniqid'
import config from './config'
import models from './models'
import utils from './fn/utils'
import prepare from './fn/prepare'
import rules from './fn/rules'

try {
  const app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: true
  }))

  app.get('/', (req, res) => {
    res.json({type: 'success', message: 'Default API route lives here.'})
  })

  app.use('/calendar', require('./controllers/calendar')({express, sequelize, uniqid, config, ...models, ...utils, ...prepare, ...rules}))

  app.listen(config.port)
  console.log('App is running on port ' + config.port)
} catch (e) {
  console.log('Error: ' + e)
  process.exit(1)
}
