const ssl = require('./loadssl')()
const path = require('path')
const Express = require('express')
const ExpressSession = require('express-session')
const ExpressSSE = require('express-sse')
const bodyParser = require('body-parser')
const serveIndex = require('serve-index')
const https = require('https')
const dateFormat = require('dateformat')
const crypto = require('crypto')
const uuidv4 = require('uuid/v4')
const _ = require('lodash')
const configs = require('./GetEnv')();
if (configs === false) {
    process.exit(1)
}
const db = require('./DBSelector')(configs).connectAll()
const templates = require('./ResourcProtector')(configs).ResourceLoad()
const mileStoneManager = require('./MileStoneManager')(configs)
const Exports = require('./Exports')(configs)
const Imports = require('./Imports')(configs)
const SVNCommit = require('./SVNCommit')(configs)
const FroalaEditorSdk = require('wysiwyg-editor-node-sdk/lib/froalaEditor.js')
const Authority = ['Waiting', 'Reviewer', 'Writer', 'Manager']
const EventType = ['Add Item', 'Delete Item', 'Modify Item', 'Link', 'UnLink']
const Documents = ['SSS', 'SRS', 'SDD', 'STD', 'STR']//SPS,SCS,SVD,
const MAX_USERS = configs.License.MaxConnection

var users = {}

const app = new Express()

const sse = new ExpressSSE('Server Side Event Initialize')
setInterval(() => {
    console.log("Users : " + Object.keys(users).length)
}, 3000);

server_https = https.createServer(ssl, app).listen(555, function () { console.log('Https server listening on port ' + 555) })
app.use(ExpressSession({ secret: '@#@$MYSIGN#@$#$', resave: false, saveUninitialized: true }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/', Express.static('./public'))
app.use('/gen', Express.static('./gen'))
// app.use('/uploads/', Express.static('./uploads/'))
app.use('/uploads/', Express.static('./uploads/'), serveIndex('./uploads/'))
server_http = app.listen(80, function () { console.log('Service Start!') })
app.get('/event', sse.init)
function SSELog(message) { sse.send(message) /* console.log(message) */ }
function SendMail(email, message) { console.log(email, message) }

// Floara Server SDK
app.post('/upload_image', function (req, res) { // Store image.
    FroalaEditorSdk.Image.upload(req, '/uploads/', function (err, data) {
        if (err) {
            console.trace(err);
            return res.send(JSON.stringify(err))
        }
        res.send(data)
    })
})

app.get('/load_images', function (req, res) {
    FroalaEditorSdk.Image.list('/uploads/', function (err, data) {
        if (err) {
            console.log(err)
            return res.status(404).end(JSON.stringify(err))
        }
        for (var x of data) {
            x.tag = x.tag.substring(0, x.tag.length - 4)
            x.tag = x.tag.split('-').join(',')
        }
        return res.send(data)
    })
})

app.post('/delete_image', function (req, res) {
    FroalaEditorSdk.Image.delete(req.body.src, function (err) {
        if (err) {
            return res.status(404).end(JSON.stringify(err))
        }
        return res.end()
    })
})

// Routers
app.get('/', function (req, res) {
    var options = ''
    for (let milestone of mileStoneManager.getMileStones()) {
        options += '<option value="rm_' + milestone + '">' + milestone + '</option>'
    }
    if (req.session.userid !== undefined) {
        console.log('logout ' + req.session.userid)
        delete users[req.session.userid]
        req.session.destroy()
    }
    var template = templates['Login']
    res.write(template.replace('#OPTIONS#', options).replace("#URL#", configs.URL))
    res.end()
})
app.get('/Alert', function (req, res) {
    var template = templates['Alert']
    res.write(template)
})
app.post('/Login', function (req, res) {
    var query = 'Select * from users where userid= ? and password= ?;'
    console.log(crypto.createHash('md5').update(req.body.password).digest('hex'))
    db['current'].query(query, [req.body.user, crypto.createHash('md5').update(req.body.password).digest('hex')], function (err, rows) {
        console.log(rows)
        if (err) { console.log(err) }
        if (rows.length === 1) {
            if (users[req.body.user] !== undefined) {
                console.log(req.body.user + ' Already connected')
                res.send('Already Connected ' + req.body.user + ' @ ' + users[req.body.user].remoteAddress.split("::")[1].split(":")[1])
                return
            }
            if (Object.keys(users).length > MAX_USERS) {
                res.send('license fully occupied (' + MAX_USERS + '/' + MAX_USERS + ')')
                return
            }
            var query = 'UPDATE users set access_addr = ?,access_time= ? where userid= ?;'
            db['current'].query(query, [(req.headers['x-forwarded-for'] || req.connection.remoteAddress).split("::")[1].split(":")[1], (new Date().getTime()), req.body.user], function (err, rows) { if (err) { console.log(err) } })
            users[req.body.user] = { updated: (new Date().getTime()), remoteAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress }
            req.session.userid = req.body.user
            req.session.privilege = rows[0].privilege
            req.session.milestone = req.body.milestone
            console.log('login ' + req.session.userid)
            res.send('OK')
            setTimeout(function () {
                SSELog(req.body.user + ' Login')
            }, 1200)
        } else {
            res.send('FAIL')
        }
    })
})

app.post('/CheckConnection', function (req, res) {
    users[req.session.userid] = { updated: (new Date().getTime()), remoteAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress }
    res.send('OK')
})

setInterval(() => {
    for (let userid in users) {
        if (users[userid].updated + 20000 < (new Date().getTime())) {
            console.log('lost heartbeat ' + userid + '@' + users[userid].remoteAddress)
            delete users[userid]
        }
    }
}, 5000)

app.get('/Configuration', function (req, res) {
    res.write(templates['Configuration'])
    res.end()
})

app.get('/log', function (req, res) {
    res.write(templates['Log'])
    res.end()
})

app.get('/Users', function (req, res) {
    res.write(templates['Users'])
    res.end()
})

app.post('/ChangePassword', function (req, res) {
    if (req.body.mode === 'GenOTP') {
        db['current'].query('Select email from users where userid=?', [req.body.user], function (err, result) {
            if (err) { console.trace(err) }
            if (result.length > 0) {
                var uuid = uuidv4()
                db['current'].query('UPDATE users set otp=? where userid= ?;', [uuid, req.body.user], function (err) {
                    if (err) {
                        console.trace(err); res.send('Fail')
                    } else {
                        SendMail(result.email, '/ChangePassword/' + req.body.user + '/' + uuid)
                        console.log('/ChangePassword/' + req.body.user + '/' + uuid)
                        res.send('OK')
                    }
                })
            } else {
                res.send('Fail')
            }
        })
    } else {
        db['current'].query('Select * from users where userid=? and otp=?', [req.body.user, req.body.otp], function (err, result) {
            if (err) { console.trace(err) }
            if (result.length > 0 && result.otp !== 'None') {
                db['current'].query('UPDATE users set password=?, otp="None" where userid= ?;', [crypto.createHash('md5').update(req.body.password).digest('hex'), req.body.user], function (err) {
                    if (err) { console.trace(err); res.send('Fail') }
                    res.send('OK')
                })
            } else {
                res.send('Fail')
            }
        })
    }
})
app.get('/ChangePassword/*', function (req, res) {
    var items = req.originalUrl.split('/')
    db['current'].query('Select * from users where userid=? and otp=?', [items[2], items[3]], function (err, result) {
        if (err) { console.trace(err) }
        var template = templates['ChangePassword']
        if (result.length > 0 && result[0].otp !== 'None') {
            res.write(template.replace('#RESULT#', 'true').replace(/#USER#/gi, items[2]).replace('#UUID#', items[3]))
            res.end()
        } else {
            res.write(template.replace('#RESULT#', 'false').replace(/#USER#/gi, items[2]).replace('#UUID#', items[3]))
            res.end()
        }
    })
})

app.post('/AddCSCI', function (req, res) {
    if (Authority.indexOf(req.session.privilege) !== 3) { res.send('OK') } else {
        db['current'].query('Insert into configuration (name,owner) VALUES(?,?);', ['', req.session.userid], function (err, result) {
            if (err) { console.trace(err) }
            SSELog('Added' + result.insertId)
            res.send('OK')
        })
    }
})

app.post('/DeleteCSCI', function (req, res) {

    if (Authority.indexOf(req.session.privilege) !== 3) { res.send('OK') } else {
        var pack = req.body.items.join()
        var query = 'DELETE FROM configuration where csciid in (' + pack + ') and owner="' + req.session.userid + '";'
        db['current'].query(query, function (err) {
            console.log(err)
            if (err) { console.trace(err) }
            res.send('OK')
        })
    }
})

app.post('/EditCSCI', function (req, res) {
    if (Authority.indexOf(req.session.privilege) !== 3) { res.send('OK') } else {
        if (req.body.csciid === undefined) {
            db['current'].query('UPDATE configuration set name=?, owner=? where csciid= ?;', [req.body.data[1], req.body.data[2], req.body.data[0]], function (err) {
                if (err) { console.trace(err) }
                var query = 'Select * from configuration;'
                db['current'].query(query, function (err, rows) {
                    for (let csci of rows) {
                        configuration[csci.csciid] = [csci.name, csci.owner, csci.docInfo]
                    }
                    if (err) { console.trace(err) }
                    res.send(configuration)
                })
            })
        } else {
            db['current'].query('UPDATE configuration set docinfo=? where csciid= ?;', [req.body.docinfo, req.body.csciid], function (err) {
                if (err) { console.trace(err) }
                var query = 'Select * from configuration;'
                db['current'].query(query, function (err, rows) {
                    for (let csci of rows) {
                        configuration[csci.csciid] = [csci.name, csci.owner, csci.docInfo]
                    }
                    if (err) { console.trace(err) }
                    res.send(configuration)
                })
            })
        }
    }
})

app.post('/EditUser', function (req, res) {
    if (Authority.indexOf(req.session.privilege) !== 3) { res.send('OK') } else {
        db['current'].query('UPDATE users set privilege=? where id= ?;', [req.body.data[3], req.body.data[0]], function (err) {
            if (err) { console.trace(err) }
            res.send('OK')
        })
    }
})

app.post('/Register', function (req, res) {
    var query = 'Insert into users (userid, password, username, access_addr, access_time, privilege) VALUES(?,?,?,?,?,"Waiting");'
    db['current'].query(query, [req.body.user, crypto.createHash('md5').update(req.body.password).digest('hex'), req.body.username, (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split("::")[1].split(":")[1], (new Date().getTime())], function (err, rows) {
        if (err) { res.send(err) } else { res.send('OK') }
    })
})

app.get('/main', function (req, res) {
    res.write(templates['Full'])
    res.end()
})
var configuration = {}
app.post('/configuration', function (req, res) {
    configuration = {}
    var query = 'Select * from configuration;'
    db[req.session.milestone].query(query, function (err, rows) {
        for (let csci of rows) {
            configuration[csci.csciid] = [csci.name, csci.owner, csci.docInfo]
        }
        if (err) { console.trace(err) }
        res.send([configuration, req.session.privilege, req.session.milestone])
    })
})
app.post('/MileStone', function (req, res) {
    var name = req.body.milestone
    mileStoneManager.setMileStone(name)
    res.send('ok')
})

app.post('/MileStone', function (req, res) {
    var name = req.body.milestone
    mileStoneManager.setMileStone(name)
    res.send('ok')
})

app.post('/Start', function (req, res) {
    var Jobs = []
    var Logs = []
    if (req.session.milestone !== 'current') {
        res.send({ userid: req.session.userid, milestone: req.session.milestone, Jobs: Jobs, Logs: Logs })
        return
    }
    db['current'].query('Select csciid, name from configuration where owner=?;', [req.session.userid], function (err, rows) {
        if (err) { console.log(err) }
        if (rows !== undefined) {
            for (let csci of rows) {
                Jobs.push([csci.csciid, csci.name])
            }
        }
        db['current'].query('Select etype, etime, item1, item2 from log where actor=? order by etime desc limit 8;', [req.session.userid], function (err, logs) {
            if (err) { console.log(err) }
            var promisearr = []
            if (logs !== undefined) {
                for (let log of logs) {
                    promisearr.push(new Promise(function (resolve, reject) {
                        db['current'].query('Select document, component, title, identifier from items where uid=?;', [log.item1], function (err, items) {
                            if (err) { console.log(err) }
                            if (items.length > 0) {
                                Logs.push([dateFormat(new Date(log.etime), 'yyyy-mm-dd HH:MM:ss'), EventType[log.etype], log.item1, log.item2, items[0].document, items[0].component, items[0].title, items[0].identifier])
                                resolve()
                            } else {
                                Logs.push([dateFormat(new Date(log.etime), 'yyyy-mm-dd HH:MM:ss'), EventType[log.etype], log.item1, log.item2])
                                resolve()
                            }
                        })
                    }))
                }
                Promise.all(promisearr).then(function (value) {
                    res.send({ userid: req.session.userid, milestone: req.session.milestone, Jobs: Jobs, Logs: Logs })
                })
            }
        })
    })
})

app.post('/CheckPermission', function (req, res) {
    if (Authority.indexOf(req.session.privilege) === 3) {
        res.send('ok')
    } else if (Authority.indexOf(req.session.privilege) > 1 && configuration[req.body.component][1] === req.session.userid) {
        res.send('ok')
    } else if (Authority.indexOf(req.session.privilege) > 2) {
        res.send('ok')
    } else { res.send('error') }
})

app.post('/Users', function (req, res) {
    if (req.session.privilege !== 'Manager') { res.send('OK') } else {
        var query = 'Select * from users;'
        var users = []
        db['current'].query(query, function (err, rows) {
            for (let user of rows) {
                users.push([user.id, user.userid, user.username, user.privilege, user.access_addr, dateFormat(new Date(user.access_time), 'yyyy-mm-dd HH:MM:ss')])
            }
            if (err) { console.trace(err) }
            res.send(users)
        })
    }
})
app.post('/logs', function (req, res) {
    var query = 'Select id,etype,etime, actor, item1, item2, context from log Order by etime desc limit 5000;'
    var logs = []

    db['current'].query(query, function (err, rows) {
        for (var row of rows) {
            logs.push([row.id, EventType[row.etype], dateFormat(new Date(row.etime), 'yyyy-mm-dd HH:MM:ss'), row.actor, row.item1, row.item2, row.change])
        }
        if (err) { console.trace(err); res.send([]) } else { res.send(logs) }
    })
})
app.get('/Review', function (req, res) {
    var today = new Date();
    var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + ' ' + time;
    var query = 'Select rm.items.component, rm.items.document, rm.configuration.name from rm.items left join rm.configuration on rm.items.component=rm.configuration.csciid where rm.items.uid=' + req.query.itemid + ';'
    db['current'].query(query, function (err, rows) {
        if (err) { console.trace(err) }
        var template = templates['Review']
        res.write(template.replace(/#USER#/gi, req.session.userid).replace(/#UID#/gi, req.query.itemid).replace(/#TIME#/gi, dateTime).replace(/#DOCUMENT#/gi, Documents[rows[0].document]).replace(/#CSCI#/gi, rows[0].name))
        res.end()
    })
})

app.post('/ReviewItem', function (req, res) {
    var query = 'Select * from rm.reviews where rm.reviews.id=' + req.body.itemid + ';'
    db['current'].query(query, function (err, rows) {
        if (err) { console.trace(err) }
        res.send(rows[0])
    })
})

app.post('/ReviewList', function (req, res) {
    var query = 'Select * from rm.reviews where rm.reviews.itemid in (select rm.items.uid from rm.items where rm.items.document=' + req.body.document + ' and rm.items.component=' + req.body.component + ');'
    console.log(query)
    db['current'].query(query, function (err, rows) {
        if (err) { console.trace(err) }
        console.log(rows)
        var data = []
        for (var row of rows) {
            data.push([row.id, row.itemid, row.reviewer, row.time, row.state === '0' ? '' : row.state === '1' ? "Accept" : "Reject"])
        }
        res.send(data)
    })
})


app.get('/ReviewConfirm', function (req, res) {
    var template = templates['ReviewConfirm']
    res.write(template.replace(/#DOCUMENT#/gi, req.query.document).replace(/#COMPONENT#/gi, req.query.component))
    res.end()
})

app.post('/ReviewConfirm', function (req, res) {
    var query = 'UPDATE reviews set comment=?, state=? where id= ?;'
    console.log([req.body.confirm.comment, req.body.confirm.state, req.body.confirm.id])
    db['current'].query(query, [req.body.confirm.comment, req.body.confirm.state, req.body.confirm.id], function (err, result) {
        if (err) { console.trace(err) }
        var query = 'Select * from rm.reviews where rm.reviews.itemid in (select rm.items.uid from rm.items where rm.items.document=' + req.body.document + ' and rm.items.component=' + req.body.component + ');'
        console.log(query)
        db['current'].query(query, function (err, rows) {
            if (err) { console.trace(err) }
            var data = []
            for (var row of rows) {
                data.push([row.id, row.itemid, row.reviewer, row.time, row.state === '0' ? '' : row.state === '1' ? "Accept" : "Reject"])
            }
            res.send(data)
        })
    })
})
app.post('/ReviewSave', function (req, res) {
    var today = new Date();
    var date = today.getFullYear() % 100 + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date + ' ' + time;
    var query = 'INSERT INTO reviews (itemid,state,asis,tobe,reviewer,time) VALUES(' + req.body.context.itemid + ',0,"' + req.body.context.asis.replace(/"/gi, '\\"') + '","' + req.body.context.tobe.replace(/"/gi, '\\"') + '","' + req.session.userid + '","' + dateTime + '");'
    console.log(query)
    db['current'].query(query, function (err, result) {
        if (err) { console.trace(err) }
        res.send('OK')
    })
})

app.post('/List', function (req, res) {
    var query = 'Select uid,type,ordering,identifier,title, (select count(*) from rm.reviews where rm.reviews.itemid=uid and state=0) as "reviews" from items where document= ? and component = ? Order by ordering asc;'
    if (req.body.filter === 'Requirement Only') {
        query = 'Select uid,type,ordering,identifier,title, (select count(*) from rm.reviews where rm.reviews.itemid=uid and state=0) as "reviews" from items where document= ? and component = ? and type!=0 Order by ordering asc;'
    }
    if (req.body.filter === 'Document Only') {
        query = 'Select uid,type,ordering,identifier,title, (select count(*) from rm.reviews where rm.reviews.itemid=uid and state=0) as "reviews" from items where document= ? and component = ? and type=0 Order by ordering asc;'
    }
    if (req.body.component === '-1') {
        query = 'Select uid,type,ordering,identifier,title, (select count(*) from rm.reviews where rm.reviews.itemid=uid and state=0) as "review" from items where document= ? and component > ? and type!=0 Order by component asc;'
    }
    db[req.session.milestone].query(query, [req.body.document, req.body.component], function (err, rows) {
        if (err) { console.trace(err); res.send({}) } else {
            var data = []
            for (var row of rows) {
                if (row.type === 0) {
                    data.push([row.uid, row.identifier, '', row.title, row.type, row.ordering, row.reviews])
                } else {
                    data.push([row.uid, '', row.identifier, row.title, row.type, row.ordering, row.reviews])
                }
            }
            db[req.session.milestone].query('Select link1,link2 from traceability;', function (err, rows) {
                if (err) { console.trace(err); res.send({}) } else {
                    res.send({ data: data, trace: rows })
                }
            })
        }
    })
})

app.post('/item', function (req, res) {
    db[req.session.milestone].query('Select * from items where uid=?', [req.body.uid], function (err, row) {
        if (err) { console.trace(err); res.send({}) } else {
            res.send(row[0])
        }
    })
})

app.post('/Align', function (req, res) {
    if (Authority.indexOf(req.session.privilege) < 2) { res.send('OK') } else {
        if (req.body.rows !== undefined) {
            var pack = []
            for (let [index, value] of _.range(parseInt(req.body.pos) + 0.1, parseInt(req.body.pos) + 0.9, 1 / req.body.rows.length).entries()) {
                pack.push('(' + req.body.rows[index] + ',' + value + ')')
            }
            var query = 'INSERT INTO items (uid,ordering) VALUES ' + pack.join() + ' ON DUPLICATE KEY UPDATE ordering=VALUES(ordering);'
            db['current'].query(query, function (err, result) {
                if (err) { console.trace(err) }
                db['current'].query('set @order=0; update items set ordering=@order:=@order+1 where document=0 order by ordering;', function (err, result) {
                    if (err) { console.trace(err) }
                    res.send('OK')
                })
            })
        } else {
            db['current'].query('set @order=0; update items set ordering=@order:=@order+1 where document=0 order by ordering;', function (err, result) {
                if (err) { console.trace(err) }
                res.send('OK')
            })
        }
    }
})

app.post('/Save', function (req, res) {
    db['current'].query('UPDATE items set type=?,identifier = ?,title= ?,src=?, uc=?, testtype=?, description=?  where uid= ?;', [req.body.context.type, req.body.context.identifier, req.body.context.title, req.body.context.src, req.body.context.uc, req.body.context.testtype, req.body.context.description, req.body.context.uid], function (err) {
        if (err) { console.trace(err) }
        res.send('OK')
        SSELog('Save Done (' + req.body.context.uid + ')')
        db['current'].query('Insert into log (etype,actor,item1, etime,context) VALUES( 2,"' + req.session.userid + '",' + req.body.context.uid + ',' + (new Date().getTime()) + ',"' + req.body.context.title + '");', function (err, result) { if (err) { console.trace(err) } })
    })
    db['current'].query('select * from items where uid= ?;', [req.body.context.uid], function (err, result) {
        if (err) { console.trace(err) }
        /*if (result.length > 0) {
          SVNCommit.Saveitem(result[0].document, result[0].component, result[0].uid, result[0].type, result[0].identifier, result[0].title, result[0].src, result[0].uc, result[0].testtype, result[0].description)
        }*/
    })
})

app.post('/Link', function (req, res) {
    if (Authority.indexOf(req.session.privilege) < 2) { res.send('OK') } else {
        var queries = []
        var queries1 = []
        for (var link1 of req.body.link1) {
            for (var link2 of req.body.link2) {
                queries.push('(' + req.body.type + ',' + link1 + ',' + link2 + ')')
                queries1.push('(' + link1 + '<=>' + link2 + ')')
            }
        }
        var items = queries.join()
        var items1 = queries1.join()
        var query = 'Insert Ignore into Traceability (type,link1,link2) VALUES' + items + ';'
        var etype = 3
        if (req.body.LinkOperation !== 'link') {
            etype = 4
            query = 'DELETE FROM Traceability where (type,link1,link2) in (' + items + ');'
        }

        db['current'].query(query, function (err) {
            if (err) { console.trace(err) }
            res.send('OK')
            SSELog((req.body.LinkOperation === 'link' ? 'Link ' : 'Unlink ') + items1)
            var logs = []
            var now = new Date().getTime()
            for (let a of queries) {
                var ids = a.split(',')
                logs.push('(' + etype + ',"' + req.session.userid + '",' + ids[1] + ',' + ids[2].split(')')[0] + ',' + now + ',"chanaged" )')
            }
            db['current'].query('Insert into log (etype,actor,item1,item2, etime,context) VALUES ' + logs.join() + ';', function (err, result) {
                if (err) { console.trace(err) }
            })
        })
    }
})

function GetIdentifier(document, component) {
    var identifier = '-' + configuration[component][0] + '-SFR-' + 'TBD'
    switch (document) {
        case '0':
            identifier = 'SSS-SFR-TBD'
            break
        case '1':
            identifier = 'R' + identifier
            break
        case '2':
            identifier = 'D' + identifier
            break
        case '3':
            identifier = 'T' + identifier
            break
    }
    return identifier
}

app.post('/AddItem', function (req, res) {
    if (Authority.indexOf(req.session.privilege) < 2) { res.send('OK') } else {
        var IdSection = GetIdentifier(req.body.document, req.body.component)
        if (req.body.type === '0') { IdSection = '1.' }
        db['current'].query('Insert into items (ordering,identifier,title,src,uc,description,type,document,component) VALUES(?,?,?,?,?,?,?,?,?);', [req.body.seq, IdSection, '', '', '', '', req.body.type, req.body.document, req.body.component], function (err, result) {
            if (err) { console.trace(err) }
            SSELog('Add Item (' + result.insertId + ')')
            db['current'].query('set @order=0; update items set ordering=@order:=@order+1 where document=? and component=? order by ordering;', [req.body.document, req.body.component], function (err, result) {
                if (err) { console.trace(err) }
                res.send('OK')
            })
            db['current'].query('Insert into log (etype,actor,item1, etime,context) VALUES( 0,"' + req.session.userid + '",' + result.insertId + ',' + (new Date().getTime()) + ',"chanaged");', function (err, result) {
                if (err) { console.trace(err) }
            })
        })
    }
})

app.post('/DeleteItems', function (req, res) {
    if (Authority.indexOf(req.session.privilege) < 2) { res.send('OK') } else {
        var pack = req.body.items.join()
        var query = 'DELETE FROM items where uid in (' + pack + ');'
        db['current'].query(query, function (err) {
            if (err) { console.trace(err) }
            db['current'].query('set @order=0; update items set ordering=@order:=@order+1 where document=0 order by ordering;', function (err, result) {
                if (err) { console.trace(err) }
                res.send('OK')
                SSELog('Delete Item (' + pack + ')')
            })
            for (var item of req.body.items) {
                db['current'].query('Insert into log (etype,actor,item1, etime,context) VALUES(1,"' + req.session.userid + '",' + item + ',' + (new Date().getTime()) + ',"chanaged");', function (err, result) {
                    if (err) { console.trace(err) }
                })
            }
        })
    }
})

app.post('/Search', function (req, res) {
    var query = 'Select * from items where uid>0 '
    var doc = (req.body.search[0] === '-1' ? '' : ' and document=' + req.body.search[0])
    var csci = (req.body.search[1] === '-1' ? '' : ' and component=' + req.body.search[1])

    if (req.body.search[3] === '') { query += doc + csci + ';' } else {
        switch (req.body.search[2]) {
            case '-1':
                query += doc + csci + (req.body.search[2] === -1 ? ';' : ' and ( locate("' + req.body.search[3] + '",title)>0 or locate("' + req.body.search[3] + '",identifier)>0 or locate("' + req.body.search[3] + '",description)>0);')
                break
            case '0':
                query += doc + csci + (req.body.search[2] === 0 ? ';' : ' and locate("' + req.body.search[3] + '",identifier)>0;')
                break
            case '1':
                query += doc + csci + (req.body.search[2] === 1 ? ';' : ' and locate("' + req.body.search[3] + '",title)>0;')
                break
            case '2':
                query += doc + csci + (req.body.search[2] === 2 ? ';' : ' and locate("' + req.body.search[3] + '",description)>0;')
                break
        }
    }
    db[req.session.milestone].query(query, function (err, rows) {
        if (err) { console.log(err) }
        var data = []
        for (var row of rows) {
            if (row.type === 0) {
                data.push([row.uid, row.identifier, '', row.title, row.type, row.ordering])
            } else {
                data.push([row.uid, '', row.identifier, row.title, row.type, row.ordering])
            }
        }
        res.send(data)
    })
})
app.post('/Import/*', function (req, res) {
    Imports.xlsx(req, res, sse)
})

app.post('/Export', function (req, res) {
    var info = {
        db: req.session.milestone === 'current' ? 'rm' : req.session.milestone,
        filename: '[' + Documents[req.body.document] + '][' + configuration[req.body.component][0] + ']_' + dateFormat(new Date(), 'yyyymmddHHMMss'),
        document: req.body.document,
        component: req.body.component,
        filter: req.body.filter,
        type: req.body.type
    }
    console.log(req.body.type)
    if (req.body.type === 'docx') {
        Exports.docx(info, res, sse)
    } else if (req.body.type === "xlsx") {
        Exports.xlsx(info, res, sse)
    } else {
        Exports.rof(info, res, sse)
    }
})

    // License
    // Electron MIT
    // HandsOntable MIT
    // Node.js MIT
    // Floara Editor Commecial $1800 with redistribution or a mobile app.

//res.write("The date and time are currently: " + dt.myDateTime());