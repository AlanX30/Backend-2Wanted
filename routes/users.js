const express = require('express')
const router = express.Router()
const userModel = require('../models/Users')
const jwt = require('jsonwebtoken')
const verifyToken = require('../Middlewares/verifyToken')
const balanceUserModel = require('../models/BalanceUser')
const nodemailer = require('nodemailer')

const reg_password = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/
const reg_numbers = /^([0-9])*$/
const reg_whiteSpace = /^$|\s+/

router.post('/api/users/signin', async(req, res) => {
    
    const { email, password } = req.body

    const user = await userModel.findOne({email: email})
    
    if (!user){
        return res.json({auth: false, error: 'Email no registrado'})
    }

    const passwordValidate = await user.matchPassword(password)

    if (!passwordValidate){
        return res.json({auth: false, error: 'La contraseña es incorrecta'})
    }

    const token = jwt.sign({id: user._id}, process.env.SECRET_JSONWEBTOKEN, {
        expiresIn: 60 * 60 * 24
    });

    res.status(200).json({
            auth: true,
            userName: user.userName,
            token
        });
    
})


/* ------------------------------------------------------------------------------------------------------- */


router.post('/api/users/signup', async (req, res) => {

    const { userName ,email, dni, password, confirm_password ,bank } = req.body
    
    if(userName === undefined || userName.length < 4 || reg_whiteSpace.test(userName) ){
        return res.json({error: 'El Usuario Debe tener 4 a 16 Caracteres, sin espacios'})
    }
    if(!reg_password.test(password)){
        return res.json({error: 'La contraseña Debe contener mayuscula, minuscula y numero, minimo 8 caracteres'})
    }

    if(confirm_password === undefined || password !== confirm_password){
        return res.json({error:'Las Contraseñas no Coinciden'})
    }
        
    const repitedEmail = await userModel.findOne({email: email})
    const repitedDni = await userModel.findOne({dni: dni})
    
    if(repitedEmail) {
        return res.json({error: 'Este email se encuentra registrado'})
    }
    if(repitedDni) {
        return res.json({error: 'Este numero de identificacion se encuentra registrado'})
    }else {
        const newUser = new userModel({ userName, email, dni, password, bank })
        newUser.password = await newUser.encryptPassword( password )
        await newUser.save()

        const token = jwt.sign({id: newUser._id}, process.env.SECRET_JSONWEBTOKEN, {
            expiresIn: 60 * 60 * 24
        })

        res.json({
            auth: true,
            token,
            userName
        })
    }
})


/* ------------------------------------------------------------------------------------------------------- */

router.get('/api/me', verifyToken ,async(req, res, next) => {

    const user = await userModel.findById(req.userToken, {password: 0})

    if (!user){
        return res.status(404).json({auth: 'false', error: 'No user found'})
    }

    res.json(user)
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/edit/passwordemail', verifyToken , async(req, res, next) => {

    try{

        const { newPassword ,password, newEmail, email } = req.body

        if(password){

            const user = await userModel.findById(req.userToken, {password: 1})

            const passwordValidate = await user.matchPassword(password)

            if (!passwordValidate){
                return res.json({error: 'La contraseña es incorrecta'})
            }

            if(!reg_password.test(newPassword)){
                return res.json({error: 'La contraseña Debe contener mayuscula, minuscula y numero, minimo 8 caracteres'})
            }

            user.password = await user.encryptPassword( newPassword )
            
            await user.save()

            return res.json({msg: 'Contraseña actualizada correctamente'})
        }
        
        if(email){
            const user = await userModel.findById(req.userToken, {email: 1})

            if(email === user.email){
                user.email = newEmail
                await user.save()
                return res.json({msg: 'Email actualizado correctamente'})
            }else{ res.json({error: 'Email actual no coincide'}) }

        }else{res.json({error: 'Error interno'})}   

    }catch(error){res.json({error: 'Error interno'})}

})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/edit/bankAccount', verifyToken , async(req, res, next) => {
    try{

        const { titular, tipo, dni, banco, numeroCuenta, tipoCuenta } = req.body

        if(!reg_numbers.test(dni)) {
            res.json({error: 'Numero de identificacion solo debe contener numeros'})
        }

        if(!reg_numbers.test(numeroCuenta)) {
            res.json({error: 'El numero de cuenta solo debe contener numeros'})
        }

        await userModel.findByIdAndUpdate(req.userToken, { bank: {
            titular, tipo, dni, banco, numeroCuenta, tipoCuenta
        }})

        res.json({msg: 'Cuenta agregada correctamente'})

    }catch(error){
        res.json({error: 'Error interno'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/remove/bankAccount', verifyToken , async(req, res, next) => {
    try{
        const user = await userModel.findById(req.userToken, {bank: 1})
        
        user.bank = {
            titular: ''
        }

        await user.save()

        res.json({msg: 'Cuenta eliminada Correctamente'})

    }catch(error){
        res.json({error: 'Error interno'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/userbalance', verifyToken, async(req, res, next) => {
    
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
        res.json({error: 'Error interno'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/newWithdraw', verifyToken, async(req, res) => {

    try{

        const { amount } = req.body
    
        const user = await userModel.findById(req.userToken, {userName: 1, wallet: 1, email: 1})
        const repited = await balanceUserModel.findOne({user: user.userName, state: 'pending'}, {state: 1})

        if(user.wallet < amount){
            return res.json({error: 'Dinero insuficiente'})
        }
        if(amount < 20000) {
            return res.json({error: 'Monto minimo de retiro $20.000'})
        }
        if(repited){
            return res.json({error: 'Tiene todavia un retiro pendiente'})
        }
    
        user.wallet = user.wallet - amount
    
        const newWithdraw = new balanceUserModel({
            user: user.userName, type: 'withdraw', withdrawAmount: amount, state: 'pending', wallet: user.wallet
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
            subject: "Retiro En Proceso",
            html: html
        })
    
        await newWithdraw.save()
        await user.save()
    
        res.json({msg: 'Tu retiro esta en proceso, recibiras un email de confirmacion al completarse la transaccion, tiempo estimado de 1 a 2 dias'})
    
    }catch(error){
        res.json({error: 'Error interno'})
    }
})



/* ------------------------------------------------------------------------------------------------------- */

module.exports = router