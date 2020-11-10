const express = require('express')
const http = require('http')
const socket = require('./socket')
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
require('dotenv').config()
require('./database')

///* ------------Socket init--------------------------------- */

const server = http.createServer(app)
socket.connect(server)

///* ------------Middlewares--------------------------------- */

app.use(cors())
app.use(bodyParser.json())
app.use(express.urlencoded({extended: false}))
app.use(express.json())

/* ------------Router--------------------------------- */

const router = require('./router')
router(app)

/* ------------Statics--------------------------------- */

app.use(express.static(path.join(__dirname + '/public')))
app.use('/home' ,express.static(path.join(__dirname + '/public')))
app.use('/sala/:id' ,express.static(path.join(__dirname + '/public')))
app.use('/profile' ,express.static(path.join(__dirname + '/public')))
app.use('/balance' ,express.static(path.join(__dirname + '/public')))
app.use('/mailverification/:token' ,express.static(path.join(__dirname + '/public')))
app.use('/changepasswordemail/:token' ,express.static(path.join(__dirname + '/public')))

/* ------------Listen--------------------------------- */

app.set('port', process.env.PORT || 8080)

server.listen(app.get('port'), ()=>{
    console.log(`server listening in http://localhost:${app.get('port')}`)
})