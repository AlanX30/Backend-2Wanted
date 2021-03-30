const express = require('express')
const socket = require('../socket')
const router = express.Router()
const invitationModel = require('../models/Invitations')
const userModel = require('../models/Users')
const verifyToken = require('../Middlewares/verifyToken')

const userConecteds = []
const userSocket = []

socket.socket.io.on('connection', async(data) => {
    
    data.on('user_online', async(username) => {

        data.username = username
        
        if(userConecteds.indexOf(data.username) === -1) {
            userConecteds.push(data.username)
            userSocket.push(data.id)
        }
     
    })

    data.on('disconnectClient', async(username) => {
        if(username){
            userSocket.splice(userConecteds.indexOf( username ), 1)
            userConecteds.splice(userConecteds.indexOf( username ), 1)
        }
    })

    data.on('disconnect', async() => {
        if(data.username){
            userSocket.splice(userConecteds.indexOf( data.username ), 1)
            userConecteds.splice(userConecteds.indexOf( data.username ), 1)
        }
    })
    
})

router.post('/api/new-invitation', verifyToken, async(req, res, next) => {
    
    try {

        const userHost = await userModel.findById(req.userToken, {userName: 1})
        
        const { newUser, parentUsername, message, salaId, salaName } = req.body

        if(newUser.length > 16){
            return res.json({error: 'Invalid User'})
        }

        if(message.length > 50){
            return res.json({error: 'Maximum 50 characters'})
        }

        const price = parseFloat(req.body.price)
        
        const host = userHost.userName

        if(host === newUser){
            return res.json({error: `Can't send yourself an invitation`})
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
        
        let indexUser = userConecteds.indexOf(newUser)

        if(indexUser > -1){
            if(socket.socket.io.sockets.connected[userSocket[indexUser]]){
                socket.socket.io.sockets.connected[userSocket[indexUser]].emit('new_message', 1)
            }
        }

        res.json({msg: 'Invitation sent'})


    }catch(error){
        res.json({error: 'Internal error'})
    }

})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/invitations', verifyToken, async(req, res, next) => {

    try {

        const userById = await userModel.findById(req.userToken, {userName: 1 ,_id: 0, notifications: 1})
        const user = userById.userName
        
        const perPage = 6
        let page  = req.body.page || 1
    
        const invitations = await invitationModel.find({user: user})
        .sort({date: -1})
        .limit(perPage)
        .skip((perPage * page) - perPage)
    
        const count = await invitationModel.countDocuments({user: user})
    
        res.json({
            invitations: invitations,
            countNotification: userById.notifications,
            totalPages: Math.ceil(count / perPage)
        })
    }catch(error){
        console.log(error)
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
        console.log(error)
        res.json({error: 'Internal error'})
    }
})


/* ------------------------------------------------------------------------------------------------------- */

module.exports = router