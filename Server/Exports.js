const { spawn } = require('child_process')
const path = require('path')



module.exports = function (configs) {
  return {
    docx: function (info, res, sse) {
      if (configs.plugins.export_docx === undefined) {
        sse.send('Export Plugin is Not Installed1')
        res.send('err')
        return
      }
      sse.send('Generate docx ....')
      const plugin = spawn(path.join('./plugins', configs.plugins.export_docx), [info.db, info.filename+"."+info.type, info.document, info.component, info.filter])
      plugin.stdout.on('data', function (data) { console.log(data.toString()) })
      plugin.stderr.on('data', function (data) { console.log(data.toString()) })
      plugin.on('close', function (code) {
        if (code === 0) {
          sse.send('Generate Done')
          setTimeout(function () {
            res.send('./gen/' + info.filename+"."+info.type)
          }, 100)
        } else {
          sse.send('Generate Fail')
          setTimeout(function () {
            res.send('err')
          }, 100)
        }
      })
    },
    xlsx: function (info, res, sse) {
      console.log(info)
      if (configs.plugins.export_xlsx === undefined) {
        sse.send('Export Plugin is Not Installed2')
        res.send('err')
        return
      }
      sse.send('Generate xlsx ....')
      const plugin = spawn(path.join('./plugins', configs.plugins.export_xlsx), [info.db, info.filename+"."+info.type, info.document, info.component, info.filter])
      plugin.stdout.on('data', function (data) { console.log(data.toString()) })
      plugin.stderr.on('data', function (data) { console.log(data.toString()) })
      plugin.on('close', function (code) {
        if (code === 0) {
          sse.send('Generate Done'); setTimeout(function () {
            res.send('./gen/' + info.filename+"."+info.type)
          }, 100)
        } else {
          sse.send('Generate Fail'); setTimeout(function () {
            res.send('err')
          }, 100)
        }
      })
    },
    rof: function (info, res, sse) {
      if (configs.plugins.export_rof === undefined) {
        sse.send('Export Plugin is Not Installed3')
        res.send('err')
        return
      }
      sse.send('Generate xlsx ....')
      const plugin = spawn(path.join('./plugins', configs.plugins.export_xlsx), [info.db, info.filename+"."+info.type, info.document, info.component, info.filter])
      plugin.stdout.on('data', function (data) { console.log(data.toString()) })
      plugin.stderr.on('data', function (data) { console.log(data.toString()) })
      plugin.on('close', function (code) {
        if (code === 0) {
          sse.send('Generate Done'); setTimeout(function () {
            res.send('./gen/' + info.filename+"."+info.type)
          }, 100)
        } else {
          sse.send('Generate Fail'); setTimeout(function () {
            res.send('err')
          }, 100)
        }
      })
    }
  }
}
