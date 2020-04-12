// Modules to control application life and create native browser window
const fs = require('fs')
//const path = require('path')
//const sha1 = require('sha1')
//const zlib = require('zlib')

module.exports= function(){
    var ret =false
    config = require('./configs.json')
    console.log(config)
    ret=config
    return ret
}
