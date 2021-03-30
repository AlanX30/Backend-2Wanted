const express = require('express')
const http = require('http')
const socket = require('./socket')
const app = express()
const bodyParser = require('body-parser' )
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const csrf = require('csurf')
const path = require('path')
const rateLimit = require("express-rate-limit")
const cors = require('cors')
require('dotenv').config()
require('./database')

const csrfProtection = csrf({ 
    cookie: true 
});

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

///* ------------Socket init--------------------------------- */

const server = http.createServer(app)
socket.connect(server)

///* ------------Middlewares--------------------------------- */

app.use(helmet())
app.use(cors())
app.use(cookieParser(process.env.SECRET_COOKIE))
app.use(limiter)
app.use(bodyParser.json())
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(csrfProtection)

/* ------------Router--------------------------------- */

const router = require('./router')
router(app)

/* ------------Statics--------------------------------- */

app.use(express.static(path.join(__dirname + '/public')))
app.use('/home', express.static(path.join(__dirname + '/public')))
app.use('/sala/:id', express.static(path.join(__dirname + '/public')))
app.use('/profile', express.static(path.join(__dirname + '/public')))
app.use('/balance', express.static(path.join(__dirname + '/public')))
app.use('/changepasswordemail/:token', express.static(path.join(__dirname + '/public')))

/* ------------Listen--------------------------------- */

app.set('port', process.env.PORT || 8080)

server.listen(app.get('port'), ()=>{
    console.log(`server listening in http://localhost:${app.get('port')}`)
})