const express = require('express')
const router = express.Router()
const salasModel = require('../models/Salas')
const verifyToken = require('./verifyToken')

router.post('/in-sala', verifyToken, async(req, res) => {  

    const salaId = req.query.id 
    const userRoot = req.body.user

    /* ------------------------Nivel 1------------------------------------------------------------------------------- */


    try{
    
        var parent1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: userRoot }}})

        var child2_1 = parent1.users[0].childsId.childId1
        var child2_2 = parent1.users[0].childsId.childId2
    
        /* ------------------------/Nivel 1------------------------------------------------------------------------------- */
        
        /* ------------------------Nivel 2------------------------------------------------------------------------------- */
        if(child2_1){
            var parent2_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child2_1 }}})
      
            
            var child3_1 = parent2_1.users[0].childsId.childId1
            var child3_2 = parent2_1.users[0].childsId.childId2
        }
        if(child2_2){
            var parent2_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child2_2 }}})
         
    
            var child3_3 = parent2_2.users[0].childsId.childId1
            var child3_4 = parent2_2.users[0].childsId.childId2
        }
        
    /* ------------------------/Nivel 2------------------------------------------------------------------------------- */
    
    /* ------------------------Nivel 3------------------------------------------------------------------------------- */
    
        if(child3_1){
            var parent3_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_1 }}})
           
            
            var child4_1 = parent3_1.users[0].childsId.childId1
            var child4_2 = parent3_1.users[0].childsId.childId2
        }
        if(child3_2){
            var parent3_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_2 }}})
           
    
            var child4_3 = parent3_2.users[0].childsId.childId1
            var child4_4 = parent3_2.users[0].childsId.childId2
        }
        if(child3_3){
            var parent3_3 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_3 }}})
            
    
            var child4_5 = parent3_3.users[0].childsId.childId1
            var child4_6 = parent3_3.users[0].childsId.childId2
        }
        if(child3_4){
            var parent3_4 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_4 }}})
          
    
            var child4_7 = parent3_4.users[0].childsId.childId1
            var child4_8 = parent3_4.users[0].childsId.childId2
        }
    
    /* ------------------------/Nivel 3------------------------------------------------------------------------------- */
    /* ------------------------Nivel 4------------------------------------------------------------------------------- */
    
        if (child4_1){
            var parent4_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_1 }}})
          
    
            var child5_1 = parent4_1.users[0].childsId.childId1
            var child5_2 = parent4_1.users[0].childsId.childId2
        }
        if(child4_2){
            var parent4_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_2 }}})
          
    
            var child5_3 = parent4_2.users[0].childsId.childId1
            var child5_4 = parent4_2.users[0].childsId.childId2
        }
        if(child4_3){
            var parent4_3 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_3 }}})
         
    
            var child5_5 = parent4_3.users[0].childsId.childId1
            var child5_6 = parent4_3.users[0].childsId.childId2
        }
        if(child4_4){
            var parent4_4 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_4 }}})
          
    
            var child5_7 = parent4_4.users[0].childsId.childId1
            var child5_8 = parent4_4.users[0].childsId.childId2
        }
        if(child4_5){
            var parent4_5 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_5 }}})
        
            
            var child5_9 = parent4_5.users[0].childsId.childId1
            var child5_10 = parent4_5.users[0].childsId.childId2
        }
        if(child4_6){
            var parent4_6 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_6 }}})
    
    
            var child5_11 = parent4_6.users[0].childsId.childId1
            var child5_12 = parent4_6.users[0].childsId.childId2
        }
        if(child4_7){
            var parent4_7 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_7 }}})
            
    
            var child5_13 = parent4_7.users[0].childsId.childId1
            var child5_14 = parent4_7.users[0].childsId.childId2
        }
        if(child4_8){
            var parent4_8 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_8 }}})
    
            var child5_15 = parent4_8.users[0].childsId.childId1
            var child5_16 = parent4_8.users[0].childsId.childId2
        }
    
    /* ------------------------/Nivel 4------------------------------------------------------------------------------- */
    
    
    const allData = [
        child2_1,child2_2,
        child3_1,child3_2,child3_3,child3_4,
        child4_1,child4_2,child4_3,child4_4,child4_5,child4_6,child4_7,child4_8,
        child5_1,child5_2,child5_3,child5_4,child5_5,child5_6,child5_7,child5_8,child5_9,child5_10,child5_11,child5_12,child5_13,child5_14,child5_15,child5_16
    ]
    
    res.json(allData)
    
    }
    catch(error){
        res.send(error)
    }
    
    })
    
    module.exports = router 