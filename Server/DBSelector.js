const fs = require('fs')
const mysql = require('mysql')

module.exports = function (configs) {
  return {
    connect: function () {
      return mysql.createConnection(configs.mysql)
    },
    connect_backups: function (db) {
      if (fs.existsSync(configs.Directory.MileStones)) {
        for (let milestone of fs.readdirSync(configs.Directory.MileStones)) {
          if (milestone.includes('.sql')) {
            var stonename = milestone.split('.sql')[0]
            configs.mysql.database = stonename
            db[stonename] = mysql.createConnection(configs.mysql)
          }
        }
      }
      return db
    },
    connectAll: function () {
      var db = {}
      db['current'] = mysql.createConnection(configs.mysql)
      db = this.connect_backups(db)
      this.db = db
      return db
    },
    test_open: function (con) {
      con.connect(function (err) {
        if (err) {
          console.error('mysql connection error :' + err)
        } else {
          console.info('mysql is connected successfully.')
        }
      })
    }
  }
}
