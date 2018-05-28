export default (sequelize, DataTypes) => {
  const Rule = sequelize.define('Rule', {
    calendar_id: DataTypes.STRING,
    timeblock_id: DataTypes.INTEGER,
    type: DataTypes.STRING,
    value: DataTypes.STRING,
    from: DataTypes.INTEGER,
    to: DataTypes.INTEGER
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'rules'
  })
  return Rule
}
