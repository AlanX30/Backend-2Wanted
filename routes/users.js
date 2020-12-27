const express = require('express')
const router = express.Router()
const userModel = require('../models/Users')
const request = require('request');
const jwt = require('jsonwebtoken')
const verifyToken = require('../Middlewares/verifyToken')
const balanceUserModel = require('../models/BalanceUser')
const nodemailer = require('nodemailer')

const reg_password = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/
const reg_whiteSpace = /^$|\s+/

const apiKey = process.env.BTCAPIKEY
const xpub = process.env.XPUB
const mnemonic = process.env.MNEMONIC

try{

}catch(error){
    res.json({error: 'Internal error'}
)}

router.post('/api/users/signin', async(req, res) => {

    try{
        const { email, password } = req.body
    
        const user = await userModel.findOne({email: email})
        
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


router.post('/api/users/signup', async (req, res) => {

    try{
        const { userName ,email, password, confirm_password ,bank } = req.body
    
        if(userName === undefined || userName.length < 4 || reg_whiteSpace.test(userName) ){
            return res.json({error: 'The User must have 4 to 16 Characters, without spaces'})
        }
        if(!reg_password.test(password)){
            return res.json({error: 'The password must contain uppercase, lowercase and number, at least 8 characters'})
        }

        if(confirm_password === undefined || password !== confirm_password){
            return res.json({error:'Passwords do not match'})
        }
            
        const repitedEmail = await userModel.findOne({email: email})
        
        if(repitedEmail) {
            return res.json({error: 'This email is registered'})
        }

        const emailHash = jwt.sign({}, process.env.EMAILHASH, {
            expiresIn: 60 * 60 * 24
        });

        const newUser = new userModel({ userName, email, password, bank, emailHash, forgotHash: emailHash })
        newUser.password = await newUser.encryptPassword(password)
        await newUser.save()

        const html = require('../PlantillasMail/mailVerification').mailVerification(emailHash)
            
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
        console.log(error)
        res.json({error: 'Internal error'}
    )}

})


/* ------------------------------------------------------------------------------------------------------- */

router.get('/api/me', verifyToken ,async(req, res) => {

    try{
        const user = await userModel.findById(req.userToken, {password: 0, emailHash: 0, forgotHash: 0})

        if (!user){
            return res.status(404).json({auth: 'false', error: 'No user found'})
        }
    
        res.json(user)
        
    }catch(error){
        res.json({error: 'Internal error'}
    )}
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/edit/passwordemail', verifyToken , async(req, res, next) => {

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

        const getPending = await balanceUserModel.findOne({type: 'withdraw', state: 'pending'})
        let pending = false
        let amountPending = 0

        if(getPending){
            pending = true
            amountPending = getPending.withdrawAmount
        }

        if(getFechaFinal && getFechaInicial){

            const user = await userModel.findById(req.userToken, {userName: 1, _id: 0})

            const fechaInicial = new Date(getFechaInicial)
    
            const fechaFinal = new Date (getFechaFinal)
        
            const fechaBalance = await balanceUserModel.find({$and: [ {user: user.userName, date: {$gte: fechaInicial}},{date: {$lt: fechaFinal}}]})
            .limit(perPage).skip((perPage * page) - perPage)
            
            const count = await balanceUserModel.countDocuments({$and: [ {user: user.userName, date: {$gte: fechaInicial}},{date: {$lt: fechaFinal}}]})

            const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

            res.json({data: fechaBalance, totalPages, pending, amountPending})

        }else{

            const user = await userModel.findById(req.userToken, {userName: 1, _id: 0})

            const count = await balanceUserModel.countDocuments({user: user.userName})

            const lastestBalance = await balanceUserModel.find({user: user.userName})
            .sort({_id: -1}).limit(perPage).skip((perPage * page) - perPage)

            const totalPages = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1

            res.json({data: lastestBalance, totalPages, pending, amountPending})

        }

    }catch(error){
        res.json({error: 'Internal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/newWithdraw', verifyToken, async(req, res) => {

    try{

        const { amount } = req.body
    
        const user = await userModel.findById(req.userToken, {userName: 1, wallet: 1, email: 1})
        const repited = await balanceUserModel.findOne({user: user.userName, state: 'pending'}, {state: 1})

        if(user.wallet < amount){
            return res.json({error: 'Insufficient money'})
        }
        if(amount < 20000) {
            return res.json({error: 'Minimum withdrawal amount $ 20,000'})
        }
        if(repited){
            return res.json({error: 'You still have a pending withdrawal'})
        }
    
        user.wallet = user.wallet - amount
    
        const newWithdraw = new balanceUserModel({
            user: user.userName, type: 'withdraw', withdrawAmount: amount, state: 'complete', wallet: user.wallet
        })
    
        const html = require('../PlantillasMail/mail').withdrawInProcces
    
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
            subject: "Withdrawal In Process",
            html: html
        })
    
        await newWithdraw.save()
        await user.save()
    
        res.json({msg: 'ok'})
    
    }catch(error){
        res.json({error: 'Error interno'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/mailverification', async(req, res) => {
    try {

        const { emailHash } = req.body
        
        const user = await userModel.findOne({emailHash: emailHash}, {userName: 1, emailHash: 1, isVerified: 1, idWallet: 1})
        if(!user){ return res.json({error: 'User is already verified'}) }

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

            if (err) { return res.json({error: 'Internal error'}) }

            const data = JSON.parse(response.body)

            user.idWallet = data.id

            const options2 = {
                url: 'https://api-eu1.tatum.io/v3/subscription',
                method: 'POST',
                body: JSON.stringify({
                  type: "ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION",
                  attr: {
                    id: data.id,
                    url: "https://cc89db3105ecebcd5094cc6de8ca059f.m.pipedream.net"
                  }
                }),
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }

            request(options2, async function(err, response2){

                if (err) { return res.json({error: 'Internal error'}) }
    
                const data = JSON.parse(response2.body)

                user.idNotifications = data.id

                await user.save()
    
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
        const user = await userModel.findOne({email: email}, {email:1, emailHash: 1, _id: 0})
        console.log(email, user)
        
        const html = require('../PlantillasMail/mailVerification').mailVerification(user.emailHash)
    
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

router.post('/api/changemailverification', async(req, res) => {
    try{
        const { newEmail, oldEmail } = req.body

        const user = await userModel.findOne({email: oldEmail}, {email: 1})

        const repitedEmail = await userModel.findOne({email: newEmail}, {email: 1})
        
        if(repitedEmail){return res.json({error: 'This email is already registered'})}

        user.email = newEmail

        await user.save()
        
        res.json({msg: 'Email updated', email: user.email})

    }catch(errror){
        res.json({error: 'Insternal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/forgotpassword', async(req, res) => {
    try{
       
        const { email } = req.body
        
        const user = await userModel.findOne({email: email}, {email: 1, forgotHash: 1})
        if(!user){
            return res.json({error: 'Username does not exist'})
        }
        
        const html = require('../PlantillasMail/forgotPassword').forgotPassword(user.forgotHash)
    
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