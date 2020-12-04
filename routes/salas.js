const express = require('express')
const router = express.Router()
const salasModel = require('../models/Salas')
const verifyToken = require('../Middlewares/verifyToken')
const positions = require('../Middlewares/positions')
const userModel = require('../models/Users')
const balanceUserModel = require('../models/BalanceUser')

const reg_whiteSpace = /^$|\s+/

router.post('/api/new/sala', verifyToken ,async(req, res) => {
    try {

        const { users, name, creator } = req.body
        const price = parseFloat(req.body.price)

        const user = await userModel.findById(req.userToken, {password: 0})
        const newSala = await new salasModel({ users, price, name, creator, usersNumber: 1, paidUsers: 0, line123: 1, line4: 0 })
        const repitedName = await salasModel.findOne({name: name}, {name: 1})
 
        if(user.wallet < price){
            return res.json({error: 'Insufficient money in wallet'})
        }
        
        if(repitedName) {
            return res.json({error: 'A room with this name already exists'})
        }

        if(reg_whiteSpace.test(name) || name.length < 4 || name.length > 15){
            return  res.json({error: 'The name must have more than 3 characters, maximum 15, must not have spaces'})
        }
        if(price < 5000 || req.body.price === '' || req.body.price === undefined ){
            return  res.json({error: 'Precio minimo de salas 5.000 COP'})
        }
    
        user.wallet = user.wallet - price

        await user.save()
        await newSala.save()

        const balanceSala = await new balanceUserModel({ 
            user: user.userName,
            salaName: newSala.name,
            salaId: newSala._id,
            salaActive: true,
            salaCreator: creator,
            salaPrice: price,
            accumulated: 0,
            usersNumber: 0,
            type: 'buy',
            wallet: user.wallet,
        })
    
        await balanceSala.save()

        res.json({msg: 'Correctly created room', id: newSala._id})

    }catch(error){
        res.json({error: 'Internal error'})
    }
})

router.post('/api/search/sala', verifyToken, async(req, res) =>{
    
    try{

        const { name, salaId, username } = req.body

        if(name) {
            if( reg_whiteSpace.test(name) ){
                return res.json({error: 'Must not contain spaces'})
            }
        }

        const salabyName = await salasModel.findOne({name: name}, {password: 0, users:0})

        if(salabyName){
            return res.json({data: salabyName})
        }
        
        const salaById = await salasModel.findById( salaId, {password: 0, users:0})

   
        if(salaById){

            const parent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: username }}})
            
            const parentUser = parent.users[0].parentId ? parent.users[0].parentId : 'Ninguno'

            const balanceUser = await balanceUserModel.findOne({salaName: salaById.name, user: username})
            .sort({_id: -1})

            return res.json({data: salaById, parentId: parentUser, inBalance: balanceUser.accumulated})
        }
            
        res.json({error: 'This room does not exist'})
        
    }
    catch(error){
        res.status(500).json({error: 'Internal error'})
    }
    
})

router.post('/api/search/listSalas', verifyToken, async(req, res) => {
    
    try{

        const user = await userModel.findById(req.userToken, {userName: 1, _id: 0})

        const perPage = 5
        let page  = req.body.page || 1
        
        if(page < 1){
            page = 1
        }

        const salas = await balanceUserModel.find({type: 'buy', user: user.userName, salaActive: true}, {salaName: 1, salaId: 1, salaPrice: 1, salaCreator: 1, _id: 0})
        .sort({date: -1})
        .limit(perPage)
        .skip((perPage * page) - perPage)
        
        const count = await balanceUserModel.countDocuments({type: 'buy', user: user.userName, salaActive: true})

        const totalfinal = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1
        
        res.json({
            data: salas,
            total: totalfinal
        })
    }
    catch(error){
        res.json({error: 'Internal error'})
    }
})

router.post('/api/newUserInSala', verifyToken, async(req, res, next) => {
    
    try {

        const { salaId, random } = req.body

        let parentUser
        
        if(random){

            const randomParent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { space: true }}})

            parentUser = randomParent.users[0].user
            
        }else{ parentUser = req.body.parentUser }   
        
        const user = await userModel.findById(req.userToken, {password: 0})
        const price = await salasModel.findById(salaId, {usersNumber: 1, price: 1, name: 1, creator: 1})
        const parent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: parentUser }}})    
        const repitedUser = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: user.userName }}})

        let countRepeated = 0

        if(repitedUser.users.length > 0){
            if(repitedUser.users[0].active === true) {
                return res.json({error: 'You are currently active in this room, you can re-enter when completing it'})
            }else if(repitedUser.users[0].active === false){ countRepeated = repitedUser.users[0].repeated + 1 }
        }
        
        if(user.wallet < price.price){
            return res.json({error: 'Not enough money'})
        }
        if(parent.users.length === 0){
            return res.json({error: 'There is no parent user in this room'})
        }
        user.wallet = user.wallet - price.price

        if(parent.users[0].childsId.childId1 === ''){
            parent.users[0].childsId.childId1 = user.userName
        }else if (parent.users[0].childsId.childId2 === ''){
            parent.users[0].space = false
            await parent.save()
            parent.users[0].childsId.childId2 = user.userName
        }else{return res.json({error: 'The parent user is full'})}
    
        await salasModel.updateOne({_id: salaId}, {
            $push: {
                'users': {
                    user: user.userName,
                    space: true,
                    parentId: parent.users[0].user,
                    childsId: {
                        childId1: '',
                        childId2: ''
                    },
                    active: true,
                    repeated: countRepeated
                }
            }
        }) 

        price.usersNumber = price.usersNumber + 1

        price.accumulated = price.accumulated + price.price

        await user.save()
        await parent.save()

        const balanceSala = await new balanceUserModel({ 
            user: user.userName,
            salaName: price.name,
            salaId: salaId,
            salaCreator: price.creator,
            salaActive: true,
            accumulated: 0,
            type: 'buy',
            wallet: user.wallet,
            salaPrice: price.price,
        })

        positions(req, res, next)

        await balanceSala.save()
        await price.save()
    
        res.json({msg: 'User added successfully', id: salaId})
        
    }catch(error){
        res.json({error: 'Internal error'})
    }
})

module.exports = router