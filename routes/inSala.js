const express = require('express')
const router = express.Router()
const salasModel = require('../models/Salas')
const verifyToken = require('./verifyToken')

router.get('/sala', verifyToken, async(req, res) => {  

    const salaId = req.query.id 
    const userRoot = req.userToken

    /* ------------------------Nivel 1------------------------------------------------------------------------------- */
    
    const childs1Nivel = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: userRoot }}})
    .populate('users.user')
    .populate('users.childsId.childId1')
    .populate('users.childsId.childId2')

    const [{childsId: {childId1, childId2}}] = childs1Nivel.users

    /* ------------------------/Nivel 1------------------------------------------------------------------------------- */

    const childs2Nivel = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: userRoot }}})

    res.json('Holis')
})

module.exports = router 