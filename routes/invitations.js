const express = require('express')
const router = express.Router()
const invitationModel = require('../models/Invitations')
const userModel = require('../models/Users')
const jwt = require('jsonwebtoken')
const verifyToken = require('./verifyToken')

router.post('/invitations', async(req, res, next) => {

    try {
        const { host, newUser, parentUsername, message, salaId, salaName } = req.body
        const price = parseFloat(req.body.price)
    
        const invitation = new invitationModel({
            user: newUser,
            read: false,
            host,
            parentUsername,
            message,
            price,
            salaId,
            salaName,
        })
    
        await invitation.save()
        res.json({msg: 'Invitacion Creada'})

    }catch(error){
        res.json({error: error})
    }

})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.get('/invitations', verifyToken ,async(req, res, next) => {
    
    const userById = await userModel.findById(req.userToken, {userName: 1 ,_id: 0})
    const user = userById.userName

    const noRead = await invitationModel.find({user: user, read: false})
    
    const limit = noRead.length > 6 ? noRead.length : 6

    const invitations = await invitationModel.find({user: user})
    .sort({_id: -1})
    .limit(limit)

    res.json({
        invitations: invitations,
        countNotification: noRead.length
    })

})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */
router.post('/invitations-reset', verifyToken, async(req, res, next) => {

    const userById = await userModel.findById(req.userToken, {userName: 1 ,_id: 0})
    const user = userById.userName

    const noRead = await invitationModel.find({user: user, read: false})

    for(let i = 0; i < noRead.length; i++) {
        noRead[i].read = true
        await noRead[i].save()
    }
   
})


/* ------------------------------------------------------------------------------------------------------- */

module.exports = router