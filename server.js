const express = require('express')
const http = require('http')
const socket = require('./socket')
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
require('dotenv').config()
require('./database')

///* ------------Socket init--------------------------------- */

const server = http.createServer(app)
socket.connect(server)

///* ------------Middlewares--------------------------------- */

app.use(bodyParser.json())
app.use(express.urlencoded({extended: false}))
app.use(express.json())

/* app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
}); */


app.set('port', process.env.PORT || 8080)

/* ------------Router--------------------------------- */

const router = require('./router')
router(app)

/* ------------Statics--------------------------------- */

app.use(express.static(path.join(__dirname + '/public')))
app.use('/home' ,express.static(path.join(__dirname + '/public')))
app.use('/sala/:id' ,express.static(path.join(__dirname + '/public')))
app.use('/profile' ,express.static(path.join(__dirname + '/public')))

/* ------------Listen--------------------------------- */

server.listen(app.get('port'), ()=>{
    console.log(`server listening in http://localhost:${app.get('port')}`)
})