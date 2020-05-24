const express = require('express')
require('./database')
const bodyParser = require('body-parser')
const session = require('express-session')
const router = require('./router')
const app = express()

//Middlewares

app.use(session({
    secret: 'mysecretapp',
    resave: true,
    saveUninitialized: true
}))
app.use(bodyParser.json())
app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});


app.set('port', process.env.PORT || 3500)


router(app)

app.listen(app.get('port'), ()=>{
    console.log(`server listening in http://localhost:${app.get('port')}`)
})