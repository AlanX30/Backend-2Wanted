const express = require('express')
const router = express.Router()
const userModel = require('../models/Users')
const jwt = require('jsonwebtoken')
const verifyToken = require('./verifyToken')

router.post('/users/signin', async(req, res, next) => {
    
    const { email, password } = req.body

    const user = await userModel.findOne({email: email})
    
    if (!user){
        return res.json({auth: false, error: 'email doesnt exist'})
    }

    const passwordValidate = await user.matchPassword(password)

    if (!passwordValidate){
        return res.json({auth: false, error: 'Password incorrect'})
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


router.post('/users/signup', async (req, res) => {

    const { userName ,email, password, confirm_password } = req.body
    
    if(userName === undefined || userName.length <= 4){
        return res.json({error: 'El Usuario Debe tener por lo menos 5 Caracteres'})
    }
    if(password === undefined || password.length <= 8 ){
        return res.json({error: 'La contraseña Debe tener por lo menos 8 Caracteres'})
    }
    if(confirm_password === undefined || password !== confirm_password){
        return res.json({error:'Contraseñas no Coinciden'})
    }
        
    const repitedEmail = await userModel.findOne({email: email})
    
    if(repitedEmail) {
        return res.json({error: 'Este email se encuentra registrado'})
    } else {
        const newUser = new userModel({ userName, email, password })
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

router.get('/me', verifyToken ,async(req, res, next) => {

    const user = await userModel.findById(req.userToken, {password: 0})

    if (!user){
        return res.status(404).json({auth: 'false', error: 'No user found'})
    }

    res.json(user)
})

/* ------------------------------------------------------------------------------------------------------- */
    
router.put('/wallet/deposit', verifyToken, async(req, res) =>{
   
    const deposit = parseFloat(req.body.deposit)
    
    const user = await userModel.findById(req.userToken, {password: 0})

    user.wallet = user.wallet + deposit

    await user.save()

    res.json(user)

})

/* ------------------------------------------------------------------------------------------------------- */
    
router.put('/wallet/withdraw', verifyToken, async(req, res) =>{
   
    const withdraw = parseFloat(req.body.withdraw)
    
    const user = await userModel.findById(req.userToken, {password: 0})

    user.wallet = user.wallet - withdraw

    await user.save()

    res.json(user)

})

module.exports = router