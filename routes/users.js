const express = require('express')
const router = express.Router()
const { verify } = require('hcaptcha')
const userModel = require('../models/Users')
const request = require('request')
const safe = require('safe-regex')
const csrf = require('csurf')
const jwt = require('jsonwebtoken')
const { v4: uuid } = require('uuid')
const verifyToken = require('../Middlewares/verifyToken')
const rateLimit = require("express-rate-limit")
const balanceUserModel = require('../models/BalanceUser')
const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

const reg_password = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/
const reg_whiteSpace = /^$|\s+/
const reg_email = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

const secretCaptcha = process.env.HCAPTCHA
const apiKey = process.env.BTCAPIKEY
const xpub = process.env.XPUB

const privateKey = fs.readFileSync(path.join(__dirname +'/private.key'), 'utf8')

const csrfProtection = csrf({ cookie: {
    httpOnly: true,
    secure: true,
    expires: false,
    maxAge: 1209600033
}})

const limiterSign = rateLimit({
    windowMs: 600000, // 10 minutos
    max: 15, // start blocking after 15 requests
    statusCode: 200, 
    message: 'has exceeded the number of attempts, try again in 10 minutes'
})

const limiterEmail = rateLimit({
    windowMs: 600000,
    max: 10,
    statusCode: 200, 
    message: 'has exceeded the number of attempts, try again in 10 minutes'
})

router.post('/api/users/signin', csrfProtection, limiterSign, async(req, res) => {

    try{

        const { email, password } = req.body

        if(safe(reg_email.test(email))){
            if(!reg_email.test(email)){
                return res.json({error: 'Invalid Email'})
            }
        }else{ return res.json({error: 'Internal error'}) }
    
        const user = await userModel.findOne({email: email}, {isVerified: 1, userName: 1, password: 1, accessToken: 1})
        
        if (!user){
            return res.json({auth: false, error: 'Wrong password or email'})
        }
        
        const passwordValidate = await user.matchPassword(password)
    
        if (!passwordValidate){
            return res.json({auth: false, error: 'Wrong password or email'})
        }
    
        if(user.isVerified === false){
            return res.json({
                auth: false,
                isVerified: false,
                email: email
            })
        }
    
        const token = jwt.sign({id: user._id}, privateKey, {
            expiresIn: 3600,
            algorithm: 'RS256'
        })

        user.accessToken = `Bearer ${token}`

        res.cookie('token', `Bearer ${token}`, {
            httpOnly: true,
            signed: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 3600000
        })

        await user.save()
    
        res.status(200).json({
            auth: true,
            userName: user.userName
        });

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'}

    )}
})

/* ------------------------------------------------------------------------------------------------------- */


router.get('/api/csrf', csrfProtection, async(req, res) => {
    try{
        res.json({csrfToken: req.csrfToken ()})
    }catch(error){
        console.log(error)
        res.json(error)
    }
})


/* ------------------------------------------------------------------------------------------------------- */


router.post('/api/users/signup', /* csrfProtection, */ limiterSign, async (req, res) => {
    
    try{

        const { userName ,email, token, password, confirm_password } = req.body

        let verifyCaptcha = await verify(secretCaptcha, token)
        console.log(verifyCaptcha, secretCaptcha, token)
        if(!verifyCaptcha.success){ return res.json({error: 'Invalid Captcha'}) }

        if(safe(reg_email.test(email))){
            if(!reg_email.test(email)){
                return res.json({error: 'Invalid Email'})
            }
        }else{ return res.json({error: 'Internal error'}) }

        if(userName === undefined || userName.length < 4 || userName.length > 16){
            return res.json({error: 'The User must have 4 to 16 Characters, without spaces'})
        }

        if(safe(reg_whiteSpace.test(userName))){
            const validDomain = reg_whiteSpace.test(userName)
            if (validDomain){
                return res.json({error: 'The User must have 4 to 16 Characters, without spaces'})
            }
        }else{ return res.json({error: 'Internal error'}) }
        
        if(safe(reg_whiteSpace.test(password))){
            if(!reg_password.test(password)){
                return res.json({error: 'The password must contain uppercase, lowercase and number, at least 8 characters'})
            }
        }else{ return res.json({error: 'Internal error'}) }

        if(confirm_password === undefined || password !== confirm_password){
            return res.json({error:'Passwords do not match'})
        }
            
        const repitedEmail = await userModel.findOne({email: email}, {email: 1})
        const repitedUser = await userModel.findOne({userName: userName}, {userName: 1})

        if(repitedEmail) {
            return res.json({error: 'This email is registered'})
        }
        if(repitedUser) {
            return res.json({error: 'This username already exists'})
        }

        const random1 = Math.floor(Math.random() * (9-0+1))
        const random2 = Math.floor(Math.random() * (9-0+1))
        const random3 = Math.floor(Math.random() * (9-0+1))
        const random4 = Math.floor(Math.random() * (9-0+1))
        const random5 = Math.floor(Math.random() * (9-0+1))
        const random6 = Math.floor(Math.random() * (9-0+1))

        const code = `${random1}${random2}${random3}${random4}${random5}${random6}`
        const uuidHash = uuid() 

        const emailHash = jwt.sign({code}, process.env.EMAILHASH, { expiresIn: 300 })
        
        const forgotHash = jwt.sign({uuidHash}, process.env.EMAILHASH, { expiresIn: 60 });

        const newUser = new userModel({ userName, email, password, emailHash, forgotHash })
        newUser.password = await newUser.encryptPassword(password)
        await newUser.save()

        const html = require('../PlantillasMail/mailVerification').mailVerification(code)
        
        let transporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.USER_ADMIN_EMAIL, 
              pass: process.env.USER_ADMIN_EMAIL_PASSWORD, 
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        await transporter.sendMail({
            from: '"2wanted.com" <admin@2wanted.com>',
            to: newUser.email,
            subject: "Email verification",
            html: html
        })

        res.json({msg: 'verifying email'})
        
    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'}
    )}

})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/logout', csrfProtection, verifyToken, async(req, res) => {

    try{
        
        const user = await userModel.findById(req.userToken, {accessToken: 1})

        user.accessToken = ''

        await user.save()

        res.clearCookie('token').json({msg: 'Cleared cookie'})

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'}
    )}
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/autologout', csrfProtection, async(req, res) => {

    try{

        const { username } = req.body

        if(!username){ return }

        const user = await userModel.findOne({userName: username}, {accessToken: 1})

        if(!user){ return }

        user.accessToken = ''

        await user.save()

        res.json({msg: 'Cleared cookie'})

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'}
    )}
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/me', csrfProtection, verifyToken, async(req, res) => {

    try{
        const user = await userModel.findById(req.userToken, {password: 0, emailHash: 0, forgotHash: 0, idWallet: 0, idNotifications: 0})

        if (!user){
            return res.json({auth: 'false', error: 'No user found'})
        }

        if(user.accessToken === req.signedCookies.token){}else{ return res.json({error: 'Token is closed'}) }
        
        const options = {
            url: `https://blockchain.info/tobtc?currency=USD&value=1`,
            method: 'GET',
          }
        
          request(options,function(err, response){
        
              if(err){return res.json({error: 'Internal Error'})} 
        
              const data = JSON.parse(response.body)
        
              if(data.statusCode && data.statusCode >= 400){ 
                return res.json({error: `${data.message} -Api tatum, Error ${data.statusCode}-`})
              }
              
              res.json({userData: user, usdBtc: data})
              
          })
        
    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'}
    )}
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/edit/passwordemail', csrfProtection, verifyToken, async(req, res, next) => {

    try{

        const { newPassword ,password, newEmail, email } = req.body

        if(newPassword){

            const user = await userModel.findById(req.userToken, {password: 1})

            const passwordValidate = await user.matchPassword(password)

            if (!passwordValidate){
                return res.json({error: 'Password is incorrect'})
            }

            if(safe(reg_password.test(newPassword))){
                if(!reg_password.test(newPassword)){
                    return res.json({error: 'The password must contain uppercase, lowercase and number, at least 8 characters'})
                }
            }else{ return res.json({error: 'Internal error'}) }

            user.password = await user.encryptPassword( newPassword )
            
            await user.save()

            return res.json({msg: 'Password updated successfully'})
        }
        
        if(email){

            if(safe(reg_email.test(email))){
                if(!reg_email.test(email)){
                    return res.json({error: 'Invalid Email'})
                }
            }else{ return res.json({error: 'Internal error'}) }

            const user = await userModel.findById(req.userToken, {email: 1, password: 1})

            const passwordValidate = await user.matchPassword(password)

            if (!passwordValidate){
                return res.json({error: 'Password is incorrect'})
            }

            if(email === user.email){
                user.email = newEmail
                await user.save()
                return res.json({msg: 'Email successfully updated'})
            }else{ res.json({error: 'Current email does not match'}) }

        }else{res.json({error: 'Internal error'})}   

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }

})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/userbalance', csrfProtection, verifyToken, async(req, res) => {
    
    try{

        const { getFechaInicial, getFechaFinal } = req.body
        
        const perPage = 10
        let page  = req.body.page || 1
        
        if(page < 1){
            page = 1
        }

        if(getFechaFinal && getFechaInicial){

            const user = await userModel.findById(req.userToken, {userName: 1, _id: 0})

            const fechaInicial = new Date(getFechaInicial)
    
            const fechaFinal = new Date (getFechaFinal)
        
            const fechaBalance = await balanceUserModel.find({$and: [ {user: user.userName, date: {$gte: fechaInicial}},{date: {$lt: fechaFinal}}]})
            .limit(perPage).skip((perPage * page) - perPage).sort({date: -1})
            
            const count = await balanceUserModel.countDocuments({$and: [ {user: user.userName, date: {$gte: fechaInicial}},{date: {$lt: fechaFinal}}]})

            const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

            res.json({data: fechaBalance, totalPages})

        }else{

            const user = await userModel.findById(req.userToken, {userName: 1, _id: 0})

            const count = await balanceUserModel.countDocuments({user: user.userName})

            const lastestBalance = await balanceUserModel.find({user: user.userName})
            .sort({date: -1}).limit(perPage).skip((perPage * page) - perPage)

            const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

            res.json({data: lastestBalance, totalPages})

        }

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
})



router.post('/api/mailverification', csrfProtection, limiterEmail, async(req, res) => {
    try {

        const { email, code } = req.body
        
        const user = await userModel.findOne({email: email}, {userName: 1, emailHash: 1, isVerified: 1, idWallet: 1})
        let codeToken 

        if (code.length > 6){ return res.json({error: 'Maximum 6 digits'})}
        
        try{
            const decodedToken = await jwt.verify(user.emailHash, process.env.EMAILHASH)
            codeToken = decodedToken.code
            if(codeToken === code){}else{return res.json({error: 'The code does not match'})}
        }catch(error){
            return res.json({error: 'The code expired'})
        }


        user.isVerified = true
        user.emailHash = null

        const options1 = {
            url: 'https://api-eu1.tatum.io/v3/ledger/account',
            method: 'POST',
            body: JSON.stringify({
              currency: 'BTC',
              xpub: xpub,
              accountingCurrency: 'USD'
            }),
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        }

        request(options1, async function(err, response){

            if(err){return res.json({error: 'Internal Error'})} 

            const data = JSON.parse(response.body)

            if(data.statusCode && data.statusCode >= 400){ 
                return res.json({error: `${data.message} -Api tatum, Error ${data.statusCode}-`})
            }
            user.idWallet = data.id

            const options2 = {
                url: 'https://api-eu1.tatum.io/v3/subscription',
                method: 'POST',
                body: JSON.stringify({
                  type: "ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION",
                  attr: {
                    id: data.id,
                    url: "https://2wanted.com/api/notificationbtc"
                  }
                  
                }),
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }

            const options3 = {
                url: `https://api-eu1.tatum.io/v3/offchain/account/${data.id}/address`,
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            } 

            request(options2, async function(err2, response2){

                if(err2){return res.json({error: 'Internal Error'})} 

                const data2 = JSON.parse(response2.body)

                if(data2.statusCode && data2.statusCode >= 400){ 
                    return res.json({error: `${data2.message} -Api tatum, Error ${data2.statusCode}-`})
                }

                user.idNotifications = data2.id

                request(options3, async function(err3, response3){
                
                    if(err3){return res.json({error: 'Internal Error'})} 
                    
                    const data3 = JSON.parse(response3.body)

                    if(data3.statusCode && data3.statusCode >= 400){ 
                        return res.json({error: `${data3.message} -Api tatum, Error ${data3.statusCode}-`})
                    }       
              
                    user.addressWallet = data3.address
                    await user.save()  

                    const token = jwt.sign({id: user._id}, privateKey, {
                        expiresIn: 3600,
                        algorithm: 'RS256'
                    });
            
                    user.accessToken = `Bearer ${token}`
            
                    await user.save()
            
                    res.cookie('token', `Bearer ${token}`, {
                        httpOnly: true,
                        signed: true,
                        secure: true,
                        sameSite: 'strict',
                        maxAge: 3600000
                    })
            
                    res.json({
                        auth: true,
                        userName: user.userName
                    })

                })
    
            })

        })

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/mailverificationRefresh', limiterEmail, async(req, res) => {
    try {

        const { email } = req.body
        const user = await userModel.findOne({email: email}, {email:1, emailHash: 1 })
        
        const random1 = Math.floor(Math.random() * (9-0+1))
        const random2 = Math.floor(Math.random() * (9-0+1))
        const random3 = Math.floor(Math.random() * (9-0+1))
        const random4 = Math.floor(Math.random() * (9-0+1))
        const random5 = Math.floor(Math.random() * (9-0+1))
        const random6 = Math.floor(Math.random() * (9-0+1))

        const code = `${random1}${random2}${random3}${random4}${random5}${random6}`

        const emailHash = jwt.sign({code}, process.env.EMAILHASH, { expiresIn: 300 })

        user.emailHash = emailHash

        await user.save()

        const html = require('../PlantillasMail/mailVerification').mailVerification(code)

        let transporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.USER_ADMIN_EMAIL, 
              pass: process.env.USER_ADMIN_EMAIL_PASSWORD, 
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        await transporter.sendMail({
            from: '"2wanted.com" <admin@2wanted.com>',
            to: user.email,
            subject: "Email verification",
            html: html
        })
        
    res.json({msg: 'E-mail sent'})
        
    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/forgotpassword', csrfProtection, limiterEmail, async(req, res) => {
    try{
       
        const { email } = req.body

        if(safe(reg_email.test(email))){
            if(!reg_email.test(email)){
                return res.json({error: 'Invalid Email'})
            }
        }else{ return res.json({error: 'Internal error'}) }
        
        const user = await userModel.findOne({email: email}, {email: 1, forgotHash: 1})

        if(!user){
            return res.json({error: 'Username does not exist'})
        }

        const uuidHash = uuid() 
        
        const forgotHash = jwt.sign({uuidHash}, process.env.EMAILHASH, { expiresIn: 300 });

        user.forgotHash = forgotHash

        await user.save()
        
        const html = require('../PlantillasMail/forgotPassword').forgotPassword(forgotHash)
        
        let transporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.USER_ADMIN_EMAIL, 
              pass: process.env.USER_ADMIN_EMAIL_PASSWORD, 
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        await transporter.sendMail({
            from: '"2wanted.com" <admin@2wanted.com>',
            to: user.email,
            subject: "Email Verification",
            html: html
        })

        res.json({msg: 'Email sent'})

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/changeForgotPassword', csrfProtection, limiterEmail, async(req, res) => {
    try{

        const { forgotHash, password, confirmPassword } = req.body

        if(safe(reg_whiteSpace.test(password))){
            if(!reg_password.test(password)){
                return res.json({error: 'The password must contain uppercase, lowercase and number, at least 8 characters'})
            }
        }else{ return res.json({error: 'Internal error'}) }
        
        const user = await userModel.findOne({forgotHash: forgotHash}, {password: 1})

        if(!user){return res.json({error: 'This user does not exist, or this link is expired'})}

        try{
            await jwt.verify(forgotHash, process.env.EMAILHASH)
        }catch(error){
            return res.json({error: 'The code expired'})
        }


        if(confirmPassword === undefined || password !== confirmPassword){
            return res.json({error:'Passwords do not match'})
        }

        user.password = await user.encryptPassword( password )

        await user.save()

        res.json({msg: 'Password updated successfully'})

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/contact_us_email', csrfProtection, limiterEmail, verifyToken, async(req, res) => {
    try {

        const { asunto, msg } = req.body

        const user = await userModel.findById(req.userToken, {userName: 1, email: 1})

        if(!user) { return res.json({error: 'Eror No User'})}

        if(asunto.length > 50){ return res.json({error: 'The subject is very long'})}
        if(msg.length > 1000){ return res.json({error: 'The message is very long'})}

        const html = require('../PlantillasMail/mailSupport').mailSupport(msg, asunto, user.userName, user.email)

        let transporter = nodemailer.createTransport({
            host: 'mail.privateemail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.USER_ADMIN_EMAIL, 
              pass: process.env.USER_ADMIN_EMAIL_PASSWORD, 
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        await transporter.sendMail({
            from: '"2wanted.com" <admin@2wanted.com>',
            to: process.env.MY_SUPPORT_EMAIL,
            subject: `Solicitud de soporte al usuario ${user.userName}`,
            html: html
        })

        res.json({msg: 'the message has been sent to support, this request will be answered in your email'})

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
})

module.exports = router