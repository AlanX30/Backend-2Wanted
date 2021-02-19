const express = require('express')
const router = express.Router()
const userModel = require('../models/Users')
const request = require('request');
const jwt = require('jsonwebtoken')
const { v4: uuid } = require('uuid')
const verifyToken = require('../Middlewares/verifyToken')
const rateLimit = require("express-rate-limit")
const balanceUserModel = require('../models/BalanceUser')
const nodemailer = require('nodemailer')

const reg_password = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/
const reg_whiteSpace = /^$|\s+/
const reg_email = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

const apiKey = process.env.BTCAPIKEY
const xpub = process.env.XPUB

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 10, // start blocking after 10 requests
    message:
      "Too many accounts created from this IP, please try again after an hour",
    handler: (res) => { res.json({error: 'Call limit'}) }
})



router.post('/api/users/signin', async(req, res) => {

    try{

        const { email, password } = req.body

        if(!reg_email.test(email)){ return res.json({error: 'Invalid Email'})}
    
        const user = await userModel.findOne({email: email}, {isVerified: 1, userName: 1, password: 1})
        
        if (!user){
            return res.json({auth: false, error: 'Email not registered'})
        }
        
        const passwordValidate = await user.matchPassword(password)
    
        if (!passwordValidate){
            return res.json({auth: false, error: 'Password is incorrect'})
        }
    
        if(user.isVerified === false){
            return res.json({
                auth: false,
                isVerified: false,
                email: email
            })
        }
    
        const token = jwt.sign({id: user._id}, process.env.SECRET_JSONWEBTOKEN, {
            expiresIn: 60 * 60 * 24
        });
    
        res.status(200).json({
            auth: true,
            userName: user.userName,
            token
        });
    }catch(error){

        res.json({error: 'Internal error'}

    )}
})


/* ------------------------------------------------------------------------------------------------------- */


router.post('/api/users/signup', limiter, async (req, res) => {
    
    try{

        const { userName ,email, password, confirm_password } = req.body
    
        if(!reg_email.test(email)){ return res.json({error: 'Invalid Email'})}

        if(userName === undefined || userName.length < 4 || reg_whiteSpace.test(userName) ){
            return res.json({error: 'The User must have 4 to 16 Characters, without spaces'})
        }
        if(!reg_password.test(password)){
            return res.json({error: 'The password must contain uppercase, lowercase and number, at least 8 characters'})
        }

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
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: 'admin@2wanted.com', 
                pass: 'A31232723s', 
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        await transporter.sendMail({
            from: '"2wanted.com" <admin@2wanted.com>',
            to: newUser.email,
            subject: "Verificacion de Email",
            html: html
        })

        res.json({msg: 'verifying email'})
        
    }catch(error){
        res.json({error: 'Internal error'}
    )}

})

/* ------------------------------------------------------------------------------------------------------- */

router.get('/api/me', verifyToken, async(req, res) => {

    try{

        const user = await userModel.findById(req.userToken, {password: 0, emailHash: 0, forgotHash: 0})

        if (!user){
            return res.status(404).json({auth: 'false', error: 'No user found'})
        }

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
        res.json({error: 'Internal error'}
    )}
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/edit/passwordemail', verifyToken, async(req, res, next) => {

    try{

        const { newPassword ,password, newEmail, email } = req.body

        if(password){

            const user = await userModel.findById(req.userToken, {password: 1})

            const passwordValidate = await user.matchPassword(password)

            if (!passwordValidate){
                return res.json({error: 'Password is incorrect'})
            }

            if(!reg_password.test(newPassword)){
                return res.json({error: 'The password must contain uppercase, lowercase and number, at least 8 characters'})
            }

            user.password = await user.encryptPassword( newPassword )
            
            await user.save()

            return res.json({msg: 'Password updated successfully'})
        }
        
        if(email){

            if(!reg_email.test(email)){ return res.json({error: 'Invalid Email'})}

            const user = await userModel.findById(req.userToken, {email: 1})

            if(email === user.email){
                user.email = newEmail
                await user.save()
                return res.json({msg: 'Email successfully updated'})
            }else{ res.json({error: 'Current email does not match'}) }

        }else{res.json({error: 'Internal error'})}   

    }catch(error){res.json({error: 'Internal error'})}

})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/userbalance', verifyToken, async(req, res) => {
    
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
            .limit(perPage).skip((perPage * page) - perPage)
            
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
        res.json({error: 'Internal error'})
    }
})



router.post('/api/mailverification', async(req, res) => {
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
                    url: "https://2wanted.io/api/notificationbtc"
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
                      
                })
    
            })

        })


        const token = jwt.sign({id: user._id}, process.env.SECRET_JSONWEBTOKEN, {
            expiresIn: 60 * 60 * 24
        });

        res.json({
            auth: true,
            userName: user.userName,
            token
        })

    }catch(error){
        res.json({error: 'Internal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/mailverificationRefresh', async(req, res) => {
    try {

        const { email } = req.body
        const user = await userModel.findOne({email: email}, {email:1, emailHash: 1, })
        
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
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: 'admin@2wanted.com', 
                pass: 'A31232723s', 
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

router.post('/api/forgotpassword', async(req, res) => {
    try{
       
        const { email } = req.body

        if(!reg_email.test(email)){ return res.json({error: 'Invalid Email'})}
        
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
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: 'admin@2wanted.com', 
                pass: 'A31232723s', 
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        await transporter.sendMail({
            from: '"2wanted.com" <admin@2wanted.com>',
            to: user.email,
            subject: "Verificacion de Email",
            html: html
        })

        res.json({msg: 'Email sent'})

    }catch(error){
        res.json({error: 'Internal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/changeForgotPassword', async(req, res) => {
    try{

        const { forgotHash, password, confirmPassword } = req.body

        const user = await userModel.findOne({forgotHash: forgotHash}, {password: 1})

        if(!user){return res.json({error: 'This user does not exist, or this link is expired'})}

        try{
            await jwt.verify(forgotHash, process.env.EMAILHASH)
        }catch(error){
            return res.json({error: 'The code expired'})
        }

        if(!reg_password.test(password)){
            return res.json({error: 'The password must contain uppercase, lowercase and number, at least 8 characters'})
        }

        if(confirmPassword === undefined || password !== confirmPassword){
            return res.json({error:'Passwords do not match'})
        }

        user.password = await user.encryptPassword( password )

        await user.save()

        res.json({msg: 'Password updated successfully'})

    }catch(error){
        res.json({error: 'Internal error'})
    }
})

module.exports = router