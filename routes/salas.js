const express = require('express')
const router = express.Router()
const salasModel = require('../models/Salas')
const verifyToken = require('./verifyToken')
const userModel = require('../models/Users')

router.post('/api/new/sala', verifyToken ,async(req, res) => {
    const { users, name, password, creator } = req.body
    const price = parseFloat(req.body.price)
    const protected = password ? true : false

    try {

        const user = await userModel.findById(req.userToken, {password: 0})
        const newSala = new salasModel({ users, price, name, password, creator, protected })
        const repitedName = await salasModel.findOne({name: name}, {name: 1})
 
        if(user.wallet < price){
            return res.json({error: 'No hay dinero suficiente'})
        }

        if(repitedName) {
            return res.json({error: 'Ya hay una sala con este nombre'})
        }

        if(name.split(" ").length > 1 || name.length < 4){
            return  res.json({error: 'El nomnbre debe tener mas de 3 caracteres y no debe tener espacios'})
        }
        if(price < 5000 || req.body.price === '' || req.body.price === undefined ){
            return  res.json({error: 'Precio minimo de salas 5.000 COP'})
        }
    
        user.wallet = user.wallet - price
    
        await user.save()
        await newSala.save()
    
        res.json({msg: 'Sala creada correctamente', id: newSala._id})

    }catch(error){
        res.json({error: error})
    }
})

router.post('/api/search/sala', verifyToken, async(req, res) =>{
    const { name, salaId } = req.body

    if(name.split(" ").length > 1 ){
        return res.json({error: 'No debe contener espacios'})
    }

    try{
        const salabyName = await salasModel.findOne({name: name}, {password: 0, users:0})

        if(salabyName){
            return res.json({data: salabyName})
        }
        
        const salaById = await salasModel.findOne({_id: salaId}, {password: 0, users:0})

        if(salaById){
            return res.json({data: salaById})
        }
            
        res.json({error: 'No existe esta sala'})
        
    }
    catch(error){
        res.json({error: error})
    }
    
})

router.post('/api/search/listSalas', verifyToken, async(req, res) => {

    const user = await userModel.findById(req.userToken, {userName: 1, _id: 0})

    const perPage = 5
    let page  = req.body.page || 1
    
    if(page < 1){
        page = 1
    }
   
    try{
        
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

router.post('/api/newUserInSala', verifyToken, async(req, res) => {
    
    const { salaId, parentUser } = req.body

    try {
        const user = await userModel.findById(req.userToken, {password: 0})
        const price = await salasModel.findById(salaId, {price: 1, _id: 0})
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
            parent.users[0].childsId.childId2 = user.userName
        }else{return res.json({error: 'El usuario padre esta lleno'})}
        
    
        await salasModel.updateOne({_id: salaId}, {
            $push: {
                'users': {
                    user: user.userName,
                    parentId: parent.users[0].user
                }
            }
        }) 
    
        await user.save()
        await parent.save()
    
        res.json({msg: 'Usuario agregado correctamente', id: salaId})
        
    }catch(error){
        res.json({error: error})
    }
})

router.post('/api/borrarsala', async(req, res) => {
    const sala = await salasModel.findByIdAndDelete(req.body.id)
    res.json(sala)
})

module.exports = router