export default {
  db: {
    user: 'test-calendar',
    password: '07Y2unJY1Ow5ADi8',
    database: 'test-calendar',
    dialect: 'mysql',
    dialectOptions: {
      socketPath: '/var/run/mysqld/mysqld.sock',
      useUTC: false
    },
    underscored: true,
    timezone: '+02:00'
  },
  env: 'dev',
  port: '41208',
  ruleTypes: {
    dayOfWeek: {
      type: 'select',
      valueType: 'string',
      options: [
        {isoWeekday: 1, id: 'mon', name: 'Monday'},
        {isoWeekday: 2, id: 'tue', name: 'Tuesday'},
        {isoWeekday: 3, id: 'wed', name: 'Wednesday'},
        {isoWeekday: 4, id: 'thu', name: 'Thursday'},
        {isoWeekday: 5, id: 'fri', name: 'Friday'}
        // {isoWeekday: 6, id: 'sat', name: 'Saturday'},
        // {isoWeekday: 7, id: 'sun', name: 'Sunday'}
      ],
      required: true
    },
    minuteStart: {
      type: 'number',
      valueType: 'integer',
      required: true
    },
    minuteDuration: {
      type: 'number',
      valueType: 'integer',
      required: true
    },
    status: {
      type: 'select',
      valueType: 'integer',
      options: [{id: 1, name: 'Open'}, {id: 2, name: 'Closed'}, {id: 3, name: 'Temporary Closed'}],
      required: true
    },
    location: {
      type: 'select',
      valueType: 'integer',
      // options: [{id: 1, name: 'Didelė salė', nameShort: 'Did'}, {id: 2, name: 'Mažoji salė', nameShort: 'Maž'}, {id: 3, name: 'Gintarinė salė', nameShort: 'Gint'}]
      options: [{id: 1, name: 'Didelė salė', nameShort: 'Did'}, {id: 2, name: 'Mažoji salė', nameShort: 'Maž'}],
      required: true
    },
    color: {
      type: 'select',
      valueType: 'string',
      options: [{id: 'blue', name: 'Blue'}, {id: 'green', name: 'Green'}, {id: 'yellow', name: 'Yellow'}, {id: 'red', name: 'Red'}, {id: 'purple', name: 'Purple'}]
    },
    name: {
      type: 'text',
      valueType: 'string'
    },
    description: {
      type: 'text',
      valueType: 'string'
    }
  }
}
