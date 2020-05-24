const express = require('express')
const router = express.Router()
const salasModel = require('../models/Salas')
const verifyToken = require('./verifyToken')
const userModel = require('../models/Users')

router.post('/new/sala', verifyToken ,async(req, res) => {
    const { users, name, password, creator } = req.body
    const price = parseFloat(req.body.price)
    
    const user = await userModel.findById(req.userToken, {password: 0})
    const newSala = new salasModel({ users, price, name, password, creator })
    
    user.wallet = user.wallet - price
    newSala.password = await newSala.encryptPassword( password )
  
    await user.save()
    await newSala.save()
    res.json(newSala)

})

router.post('/search/sala', verifyToken, async(req, res) =>{
    const { name } = req.body
    
    const salabyName = await salasModel.findOne({name: name}, {password: 0, users:0})

    res.json(salabyName)
})

router.get('/search/listSalas', verifyToken, async(req, res) => {
    const salas = await salasModel.find({ users: {$elemMatch: { user: req.userToken }} }, {name: 1, price: 1, creator: 1})

    res.json(salas)
 
})

router.post('/newUserInSala', verifyToken, async(req, res) => {
    
    const { salaId, parentUser } = req.body
    const userId = req.userToken

    const parentUserId = await userModel.findOne({userName: parentUser},{_id: 1})
    if(!parentUserId){
        return res.json({error: 'No existe este usuario'})
    }
    const parentId = parentUserId._id

    const parent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: parentId }}})
    .populate('users.user')
    .populate('users.childsId.childId1')
    .populate('users.childsId.childId2')

    if(!parent){
        return res.json({error: 'No existe el usuario en esta sala'})
    }

    await salasModel.updateOne({_id: salaId}, {
        $push: {
            'users': {
                user: userId,
                parentId: parentId
            }
        }
    }) 

    const price = await salasModel.findById(salaId, {price: 1, _id: 0})
    const user = await userModel.findById(req.userToken, {password: 0})

    if(user.wallet < price.price){
        return res.json({error: 'No hay dinero suficiente'})
    }

    user.wallet = user.wallet - price.price
    
    if(parent.users[0].childsId.childId1 === undefined){
        parent.users[0].childsId.childId1 = userId
    }else if (parent.users[0].childsId.childId2 === undefined){
        parent.users[0].childsId.childId2 = userId
    }
    
    await user.save()
    await parent.save()

    res.json(parent)

})

/* router.get('/salas/user', async(req, res) => {
    const salas = await salasModel.findOne({ users: {$elemMatch: { user: "5ebd65cd91f9260854e820e1" }} }, {users: {$elemMatch: { user: "5ebd65cd91f9260854e820e1" }}})
    .populate('users.user')
    .populate('users.childsId')
    
    const [{user}] = salas.users

    res.json(user)

})

 */

module.exports = router 