const express = require('express')
const router = express.Router()
const salasModel = require('../models/Salas')
const verifyToken = require('./verifyToken')
const userModel = require('../models/Users')

router.post('/api/new/sala', verifyToken ,async(req, res) => {
    const { users, name, password, creator } = req.body
    const price = parseFloat(req.body.price)
    const protected = password ? true : false
    
    const user = await userModel.findById(req.userToken, {password: 0})
    const newSala = new salasModel({ users, price, name, password, creator, protected })
    
    if(user.wallet < price){
        return res.json({error: 'No hay dinero suficiente'})
    }

    user.wallet = user.wallet - price

    await user.save()
    await newSala.save()
    res.json({msg: 'Sala creada correctamente'})

})

router.post('/api/search/sala', verifyToken, async(req, res) =>{
    const { name, salaId } = req.body

    try{
        const salabyName = await salasModel.findOne({name: name}, {password: 0, users:0})

        if(salabyName){
            return res.json({data: salabyName})
        }else{
            const salaById = await salasModel.findById(salaId, {password: 0, users:0})

            if(salaById){
                res.json({data: salaById})
            }else{res.json({error: 'No existe esta sala'})}
        }
        
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

        const count = await salasModel.countDocuments({users: {$elemMatch: { user: req.userToken }}})

        res.json({
            data: salas,
            total: Math.ceil(count / perPage)
        })
    }
    catch(error){
        res.json({error: error})
    }
})

router.post('/api/newUserInSala', verifyToken, async(req, res) => {
    
    const { salaId, parentUser } = req.body
    
    const user = await userModel.findById(req.userToken, {password: 0})
    const price = await salasModel.findById(salaId, {price: 1, _id: 0})
    const parent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: parentUser }}})    
   
    
    if(user.wallet < price.price){
        return res.json({error: 'No hay dinero suficiente'})
    }
    if(!parent){
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

    res.json({msg: 'Usuario agregado correctamente'})

})

module.exports = router 