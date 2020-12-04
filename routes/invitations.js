const express = require('express')
const socket = require('../socket')
const router = express.Router()
const invitationModel = require('../models/Invitations')
const userModel = require('../models/Users')
const ConectedModel = require('../models/Conected')
const verifyToken = require('../Middlewares/verifyToken')

socket.socket.io.on('connection', async(data) => {

    data.on('user_online', async(username) => {

        data.username = username

        const conected = await ConectedModel.findOne({userName: data.username})

        if(!conected){
            const new_conected = new ConectedModel({
                userName: data.username,
                socket: data.id
            })
            await new_conected.save() 
        }
    })

    data.on('disconnectClient', async(username) => {
        if(username){
            await ConectedModel.findOneAndRemove({userName: username})
        }
    })

    data.on('disconnect', async() => {
        if(data.username){
            await ConectedModel.findOneAndRemove({userName: data.username})
        }
    })
    
})

router.post('/api/new-invitation', verifyToken, async(req, res, next) => {
    
    try {

        const { host, newUser, parentUsername, message, salaId, salaName } = req.body
        const price = parseFloat(req.body.price)
        
        if(host === newUser){
            return res.json({error: `Can't send yourself an invitation`})
        }

        if(message.length > 50){
            return res.json({error: 'Maximum 50 characters'})
        }

        const user = await userModel.findOne({userName: newUser}, {userName: 1, notifications: 1})

        if(!user){
            return res.json({error: 'User not found'})
        }

        user.notifications = user.notifications + 1
    
        const invitation = new invitationModel({
            user: newUser,
            host,
            parentUsername,
            message,
            price,
            salaId,
            salaName,
        })
    
        await invitation.save()
        await user.save()

        const user_conected = await ConectedModel.findOne({userName: newUser})
        
        if(user_conected){
            if(socket.socket.io.sockets.connected[user_conected.socket]){
                socket.socket.io.sockets.connected[user_conected.socket].emit('new_message', 1)
            }
        }

        res.json({msg: 'Invitation sent'})


    }catch(error){
        res.json({error: 'Internal error'})
    }

})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/invitations', verifyToken ,async(req, res, next) => {

    try {

        const userById = await userModel.findById(req.userToken, {userName: 1 ,_id: 0, notifications: 1})
        const user = userById.userName
        
        const perPage = 6
        let page  = req.body.page || 1
    
        const invitations = await invitationModel.find({user: user})
        .sort({_id: -1})
        .limit(perPage)
        .skip((perPage * page) - perPage)
    
        const count = await invitationModel.countDocuments({user: user})
    
        res.json({
            invitations: invitations,
            countNotification: userById.notifications,
            totalPages: Math.ceil(count / perPage)
        })
    }catch(error){
        res.json({error: 'Internal error'})
    }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */
router.post('/api/invitations-reset', verifyToken, async(req, res, next) => {

    try {
        const user = await userModel.findById(req.userToken, {notifications: 1})
        
        user.notifications = 0

        user.save()

        res.json({msg: 'ok'})
 
    }catch(error){
        res.json({error: 'Internal error'})
    }
})


/* ------------------------------------------------------------------------------------------------------- */

module.exports = router