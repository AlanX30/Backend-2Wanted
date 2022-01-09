const express = require('express')
const http = require('http')
const socket = require('./socket')
const app = express()
const server = http.createServer(app)
const bodyParser = require('body-parser' )
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const csp = require('helmet-csp')
const path = require('path')
require('dotenv').config()
require('./database')

///* ------------Socket init--------------------------------- */

socket.connect(server)

///* ------------Middlewares--------------------------------- */

app.use(helmet())
app.use(cookieParser(process.env.SECRET_COOKIE))
app.use(bodyParser.json())
app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(
    csp({
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", "'unsafe-inline'", 'https://fonts.gstatic.com/', 'https://www.google.com/'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
      reportOnly: false,
    })
)
app.use(function (req, res, next) {
    res.setHeader(
      'Content-Security-Policy',
      `font-src * https://fonts.gstatic.com/ https://fonts.googleapis.com/`
    );
    next();
})

/* ------------Router--------------------------------- */

const router = require('./router')
router(app)

/* ------------Statics--------------------------------- */

app.use(express.static(path.join(__dirname + '/public')))
app.use('/home', express.static(path.join(__dirname + '/public')))
app.use('/contact_us', express.static(path.join(__dirname + '/public')))
app.use('/K9N1820/to/access', express.static(path.join(__dirname + '/public')))
app.use('/help', express.static(path.join(__dirname + '/public')))
app.use('/adminHome', express.static(path.join(__dirname + '/public')))
app.use('/historyUsers/:fecha1/:fecha2/:user', express.static(path.join(__dirname + '/public')))
app.use('/historyUsers/:user', express.static(path.join(__dirname + '/public')))
app.use('/historyUsers/:user/:sala', express.static(path.join(__dirname + '/public')))
app.use('/help', express.static(path.join(__dirname + '/public')))
app.use('/sala/:id', express.static(path.join(__dirname + '/public')))
app.use('/profile', express.static(path.join(__dirname + '/public')))
app.use('/balance', express.static(path.join(__dirname + '/public')))
app.use('/changepasswordemail/:token', express.static(path.join(__dirname + '/public')))

/* ------------Listen--------------------------------- */

app.set('port', process.env.PORT || 8080)

server.listen(app.get('port'), ()=>{
    console.log(`server listening in http://localhost:${app.get('port')}`)
})