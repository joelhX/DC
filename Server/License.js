var fs = require('fs')
const zlib = require('zlib')
var sha1 = require('sha1');


module.exports = function () {
    return {
        CheckLicense: function () {
            try {
                var LicenseFile = fs.readFileSync('./License.key')
            }
            catch (err) {
                console.log("License Check ", 'License.key file Not Found')
                return
            }

            try {
                buffer = zlib.unzipSync(LicenseFile)
            }
            catch (err) {
                console.log("License Check ", 'License.key file is polluted')
                return
            }
            console.log(buffer.toString())
            var License = JSON.parse(buffer.toString())
            
            var key = License.key
            delete License.key
            console.log(key)
            console.log(sha1(JSON.stringify(License)))

            if (key == sha1(JSON.stringify(License))) {
                var configs = License
            }
            else {
                console.log("License Check ", 'License.key file is Not Valid11')
                return
            }
        }
    }
}
// deflate('../resource')
