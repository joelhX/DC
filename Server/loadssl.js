const fs = require('fs')
const path = require('path')
module.exports = function () {
  return { key: fs.readFileSync(path.join('./keys/', 'key.pem')), cert: fs.readFileSync(path.join('./keys/', 'cert.pem')) }
}
