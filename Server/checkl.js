const fs = require('fs')
const zlib=require('zlib')
const sha1=require('sha1')

function CheckLicense() {
    try {
        var LicenseFile = fs.readFileSync('License.key')
    }
    catch (err) {
        console.log(err)
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

    if (key == sha1(JSON.stringify(License))) {
        var configs = License
        console.log("License Check ")
    }
    else {
        console.log("License Check ", 'License.key file is Not Valid11')
        return
    }
}

CheckLicense()