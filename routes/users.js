const express = require('express')
const router = express.Router()
const userModel = require('../models/Users')
const jwt = require('jsonwebtoken')
const verifyToken = require('./verifyToken')

router.post('/api/users/signin', async(req, res, next) => {
    
    const { email, password } = req.body

    const user = await userModel.findOne({email: email})
    
    if (!user){
        return res.json({auth: false, error: 'Email no registrado'})
    }

    const passwordValidate = await user.matchPassword(password)

    if (!passwordValidate){
        return res.json({auth: false, error: 'La contraseña es incorrecta'})
    }

    const token = jwt.sign({id: user._id}, 'SecretToken', {
        expiresIn: 60 * 60 * 24
    });

    res.status(200).json({
            auth: true,
            userName: user.userName,
            token
        });
    
})


/* ------------------------------------------------------------------------------------------------------- */

const reg_password = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/

router.post('/api/users/signup', async (req, res) => {

    const { userName ,email, dni, password, confirm_password } = req.body
    
    if(userName === undefined || userName.length < 4){
        return res.json({error: 'El Usuario Debe tener 4 a 16 Caracteres'})
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
        const newUser = new userModel({ userName, email, dni, password })
        newUser.password = await newUser.encryptPassword( password )
        await newUser.save()

        const token = jwt.sign({id: newUser._id}, 'SecretToken', {
            expiresIn: 60 * 60 * 24
        })

        res.json({
            auth: true,
            token: token
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

module.exports = router