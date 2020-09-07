const express = require('express')
const router = express.Router()
const salasModel = require('../models/Salas')
const verifyToken = require('./verifyToken')
const positions = require('./positions')
const userModel = require('../models/Users')
const balanceUserModel = require('../models/BalanceUser')
const mongoXlsx = require('mongo-xlsx');

const reg_whiteSpace = /^$|\s+/

router.post('/api/new/sala', verifyToken ,async(req, res) => {
    const { users, name, creator } = req.body
    const price = parseFloat(req.body.price)

    try {

        const user = await userModel.findById(req.userToken, {password: 0})
        const newSala = await new salasModel({ users, price, name, creator, usersNumber: 1, paidUsers: 0 })
        const repitedName = await salasModel.findOne({name: name}, {name: 1})
 
        if(user.wallet < price){
            return res.json({error: 'No hay dinero suficiente'})
        }
        
        if(repitedName) {
            return res.json({error: 'Ya hay una sala con este nombre'})
        }

        if(reg_whiteSpace.test(name) || name.length < 4 || name.length > 15){
            return  res.json({error: 'El nomnbre debe tener mas de 3 caracteres, maximo 15, no debe tener espacios'})
        }
        if(price < 5000 || req.body.price === '' || req.body.price === undefined ){
            return  res.json({error: 'Precio minimo de salas 5.000 COP'})
        }
    
        user.wallet = user.wallet - price

        await user.save()
        await newSala.save()

        const balanceSala = new balanceUserModel({ 
            user: user.userName,
            salaName: newSala.name,
            salaPrice: price,
            accumulated: 0,
            usersNumber: 0,
            type: 'buy',
            wallet: user.wallet,
        })
    
        await balanceSala.save()

        res.json({msg: 'Sala creada correctamente', id: newSala._id})

    }catch(error){
        res.json({error: 'Error interno'})
    }
})

router.post('/api/search/sala', verifyToken, async(req, res) =>{
    
    try{

        const { name, salaId, username } = req.body

        if(name) {
            if( reg_whiteSpace.test(name) ){
                return res.json({error: 'No debe contener espacios'})
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
            
        res.json({error: 'No existe esta sala'})
        
    }
    catch(error){
        res.status(500).json({error: 'Error Interno'})
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
   
        const salas = await salasModel.find({ users: {$elemMatch: { user: user.userName }} }, {name: 1, price: 1, creator: 1})
        .sort({_id: -1})
        .limit(perPage)
        .skip((perPage * page) - perPage)

        const count = await salasModel.countDocuments({users: {$elemMatch: { user: user.userName }}})

        const totalfinal = Math.ceil(count / perPage) > 0 ? Math.ceil(count / perPage) : 1
        
        res.json({
            data: salas,
            total: totalfinal
        })
    }
    catch(error){
        res.json({error: error})
    }
})

router.post('/api/newUserInSala', verifyToken, async(req, res, next) => {
    
    try {

        const { salaId, random } = req.body

        let parentUser
        
        if(random){

            const randomParent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { space: 'true' }}})

            parentUser = randomParent.users[0].user
            
        }else{ parentUser = req.body.parentUser }   
        
        const user = await userModel.findById(req.userToken, {password: 0})
        const price = await salasModel.findById(salaId, {usersNumber: 1, price: 1, name: 1})
        const parent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: parentUser }}})    
        const repitedUser = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: user.userName }}})
        

        if(repitedUser.users.length > 0) {
            return res.json({error: 'Ya perteneces a esta sala, puedes volver a entrar al completarla'})
        }
        
        if(user.wallet < price.price){
            return res.json({error: 'No hay dinero suficiente'})
        }
        if(parent.users.length === 0){
            return res.json({error: 'No existe el padre usuario en esta sala'})
        }
        user.wallet = user.wallet - price.price

        if(parent.users[0].childsId.childId1 === ''){
            parent.users[0].childsId.childId1 = user.userName
        }else if (parent.users[0].childsId.childId2 === ''){
            parent.users[0].space = 'false'
            await parent.save()
            parent.users[0].childsId.childId2 = user.userName
        }else{return res.json({error: 'El usuario padre esta lleno'})}
    
        await salasModel.updateOne({_id: salaId}, {
            $push: {
                'users': {
                    user: user.userName,
                    space: 'true',
                    parentId: parent.users[0].user,
                    childsId: {
                        childId1: '',
                        childId2: ''
                    },
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
            accumulated: 0,
            type: 'buy',
            wallet: user.wallet,
            salaPrice: price.price,
        })

        positions(req, res, next)

        await balanceSala.save()
        await price.save()
    
        res.json({msg: 'Usuario agregado correctamente', id: salaId})
        
    }catch(error){
        res.json({error: 'Error Interno'})
    }
})

router.post('/api/borrarsala', async(req, res) => {
    
    const sala = await salasModel.findByIdAndDelete(req.body.id)
    
    res.json(sala)

})

module.exports = router