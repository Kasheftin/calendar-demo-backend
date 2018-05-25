import fs from 'fs'
import path from 'path'
import Sequelize from 'sequelize'
import config from '../config'

const basename = path.basename(module.filename)
const db = {}
const sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, config.db)

fs
  .readdirSync(__dirname)
  .forEach(function(file) {
    if (file.charAt(0) !== '.' && file !== basename && file.slice(-3) === '.js') {
      const model = sequelize.import(path.join(__dirname, file))
      db[model.name] = model
    }
  })

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].options.classMethods && db[modelName].options.classMethods.associate) {
    db[modelName].options.classMethods.associate(db)
  }
});

db.sequelize = sequelize
db.Sequelize = Sequelize

export default db
