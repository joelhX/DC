const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

module.exports = function (configs) {
  return {
    xlsx: function (req, res, sse) {
      console.log("fsd")
      var info = {
        type : req.originalUrl.split('/')[2],
        document : req.originalUrl.split('/')[3],
        component : req.originalUrl.split('/')[4],
        filename: path.join(configs.Directory.temp, req.originalUrl.split('/')[3] + '_' + req.originalUrl.split('/')[4] + '_' + new Date().getTime() + "." + req.originalUrl.split('/')[2])
      }
      console.log(info)
      
      req.pipe(fs.createWriteStream(info.filename)).on('finish', function (err) {
        if (err) { console.log(err) }
        sse.send('Import xlsx ....')
        const plugin = spawn(path.join('./plugins/', configs.plugins.import), [info.filename, info.document, info.component])
        plugin.stdout.on('data', function (data) { console.log(data.toString()) })
        plugin.stderr.on('data', function (data) { console.log(data.toString()) })
        plugin.on('close', function (code) {
          fs.unlinkSync(info.filename)
          if (code === 0) {
            sse.send('Import Done')
            setTimeout(function () {
              res.send('ok')
            }, 100)
          } else {
            sse.send('Import Fail'); setTimeout(function () {
              res.send('err')
            }, 100)
          }
        })
      })
    }
  }
}
