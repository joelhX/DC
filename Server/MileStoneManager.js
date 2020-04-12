const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
module.exports = function (configs) {
  return {
    getMileStones: function () {
      var stones = []
      if (fs.existsSync(configs.Directory.MileStones)) {
        for (let milestone of fs.readdirSync(configs.Directory.MileStones)) {
          if (milestone.includes('.sql')) {
            var stonename = milestone.split('rm_')[1].split('.sql')[0]
            stones.push(stonename)
          }
        }
      }
      return stones
    },
    setMileStone: function (name) {
      const cmd = spawn(path.join(configs.Directory.plugins, configs.plugins.export_milestone), [configs.mysql.user, configs.mysql.password, configs.Directory.MileStones, name])
      cmd.stdout.on('data', function (data) { console.log(data.toString()) })
      console.log('setmilestone')
    }
  }
}
