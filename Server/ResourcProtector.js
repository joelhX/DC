var fs = require('fs')
var path = require('path')
const zlib = require('zlib')

module.exports = function () {
  return {
    ResourceLoad: function () {
      var files = {}
      for (let filename of fs.readdirSync('./templates')) {
        if (filename.includes('.rcs')) {
          var chtml = fs.readFileSync(path.join('./templates', filename), { encoding: 'utf8' })
          var buffer = Buffer.from(chtml, 'base64')
          zlib.unzip(buffer, (err, buffer) => {
            if (!err) {
              files[filename.split('.')[0]] = buffer.toString()
            } else {
              console.log('load fail ' + filename) // handle error
            }
          })
        }
      }
      return files
    },
    ResourceDeflate: function (dir) {
      for (let filename of fs.readdirSync(dir)) {
        if (filename.includes('.html')) {
          var buffer = fs.readFileSync(path.join(dir, filename), { encoding: 'utf8' })
          zlib.deflate(buffer, (err, buffer) => {
            if (!err) {
              fs.writeFileSync(path.join(dir, filename.split('.')[0] + '.rcs'), buffer.toString('base64'))
            } else {
              // handle error
            }
          })
        }
      }
    }
  }
}
// deflate('../resource')
