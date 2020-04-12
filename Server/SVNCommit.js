const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

module.exports = function (configs) {
  return {
    Saveitem: function (document, component, uid, type, identifier, title, src, order, uc, testtype, description) {
      var buffer = '<h2>type:</h2><p>' + type + '</p>' +
        '<h2>identifier:</h2><p>' + identifier + '</p>' +
        '<h2>title:</h2><p>' + title + '</p>' +
        '<h2>src:</h2><p>' + src + '</p>' +
        '<h2>uc:</h2><p>' + uc + '</p>' +
        '<h2>order:</h2><p>' + order + '</p>' +
        '<h2>testtype:</h2><p>' + testtype + '</p>' +
        '<h2>description:</h2>' + description
      var dir = path.join(configs.Directory.items, document + '_' + component)
      if (!fs.existsSync(dir)) {
        if (!fs.existsSync(configs.Directory.items)) {
          fs.mkdirSync(configs.Directory.items)
        }
        fs.mkdirSync(dir)
      }
      fs.writeFileSync(path.join(dir, uid + '.html'), buffer)
      spawn('svn', ['add --force .\items\*']).on('close', function (code) {
        console.log(uid + ' Saved')
        spawn('svn', ['commit .\items\ -m 123']).on('close', function (code) {
          console.log('commit')
        })
      })
    }
  }
}
