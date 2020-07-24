const express = require('express')
const router = express.Router()
const userModel = require('../models/Users')
const jwt = require('jsonwebtoken')
const verifyToken = require('./verifyToken')

const reg_password = /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,16}$/
const reg_numbers = /^([0-9])*$/
const reg_whiteSpace = /^$|\s+/

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

        console.log(user)

        res.json({msg: 'Cuenta eliminada Correctamente'})

    }catch(error){
        res.json({error: 'Error interno'})
    }
})

module.exports = router