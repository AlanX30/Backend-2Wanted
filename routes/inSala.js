const express = require('express')
const router = express.Router()
const salasModel = require('../models/Salas')
const verifyToken = require('./verifyToken')

router.get('/sala', verifyToken, async(req, res) => {  

    const salaId = req.query.id 
    const userRoot = req.userToken

    /* ------------------------Nivel 1------------------------------------------------------------------------------- */
    
    var parent1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: userRoot }}})
    .populate('users.user')
    .populate('users.childsId.childId1')
    .populate('users.childsId.childId2')

    var child2_1 = parent1.users[0].childsId.childId1
    var child2_2 = parent1.users[0].childsId.childId2

    /* ------------------------/Nivel 1------------------------------------------------------------------------------- */
    
    /* ------------------------Nivel 2------------------------------------------------------------------------------- */
    if(child2_1){
        var parent2_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child2_1._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child3_1 = parent2_1.users[0].childsId.childId1
        var child3_2 = parent2_1.users[0].childsId.childId2
    }
    if(child2_2){
        var parent2_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child2_2._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child3_3 = parent2_2.users[0].childsId.childId1
        var child3_4 = parent2_2.users[0].childsId.childId2
    }
    
/* ------------------------/Nivel 2------------------------------------------------------------------------------- */

/* ------------------------Nivel 3------------------------------------------------------------------------------- */

    if(child3_1){
        var parent3_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_1._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child4_1 = parent3_1.users[0].childsId.childId1
        var child4_2 = parent3_1.users[0].childsId.childId2
    }
    if(child3_2){
        var parent3_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_2._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child4_3 = parent3_2.users[0].childsId.childId1
        var child4_4 = parent3_2.users[0].childsId.childId2
    }
    if(child3_3){
        var parent3_3 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_3._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child4_5 = parent3_3.users[0].childsId.childId1
        var child4_6 = parent3_3.users[0].childsId.childId2
    }
    if(child3_4){
        var parent3_4 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child3_4._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child4_7 = parent3_4.users[0].childsId.childId1
        var child4_8 = parent3_4.users[0].childsId.childId2
    }

/* ------------------------/Nivel 3------------------------------------------------------------------------------- */
/* ------------------------Nivel 4------------------------------------------------------------------------------- */

    if (child4_1){
        var parent4_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_1._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child5_1 = parent4_1.users[0].childsId.childId1
        var child5_2 = parent4_1.users[0].childsId.childId2
    }
    if(child4_2){
        var parent4_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_2._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child5_3 = parent4_2.users[0].childsId.childId1
        var child5_4 = parent4_2.users[0].childsId.childId2
    }
    if(child4_3){
        var parent4_3 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_3._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child5_5 = parent4_3.users[0].childsId.childId1
        var child5_6 = parent4_3.users[0].childsId.childId2
    }
    if(child4_4){
        var parent4_4 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_4._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child5_7 = parent4_4.users[0].childsId.childId1
        var child5_8 = parent4_4.users[0].childsId.childId2
    }
    if(child4_5){
        var parent4_5 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_5._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child5_9 = parent4_5.users[0].childsId.childId1
        var child5_10 = parent4_5.users[0].childsId.childId2
    }
    if(child4_6){
        var parent4_6 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_6._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child5_11 = parent4_6.users[0].childsId.childId1
        var child5_12 = parent4_6.users[0].childsId.childId2
    }
    if(child4_7){
        var parent4_7 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_7._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child5_13 = parent4_7.users[0].childsId.childId1
        var child5_14 = parent4_7.users[0].childsId.childId2
    }
    if(child4_8){
        var parent4_8 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child4_8._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child5_15 = parent4_8.users[0].childsId.childId1
        var child5_16 = parent4_8.users[0].childsId.childId2
    }

/* ------------------------/Nivel 4------------------------------------------------------------------------------- */

/* ------------------------/Nivel 5------------------------------------------------------------------------------- */
    if(child5_1){
        var parent5_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_1._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_1 = parent5_1.users[0].childsId.childId1.userName
        var child6_2 = parent5_1.users[0].childsId.childId2
    }
    if(child5_2){
        var parent5_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_2._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_3 = parent5_2.users[0].childsId.childId1
        var child6_4 = parent5_2.users[0].childsId.childId2
    }
    if(child5_3){
        var parent5_3 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_3._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_5 = parent5_3.users[0].childsId.childId1
        var child6_6 = parent5_3.users[0].childsId.childId2
    }
    if(child5_4){
        var parent5_4 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_4._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_7 = parent5_4.users[0].childsId.childId1
        var child6_8 = parent5_4.users[0].childsId.childId2
    }
    if(child5_5){
        var parent5_5 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_5._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_9 = parent5_5.users[0].childsId.childId1
        var child6_10 = parent5_5.users[0].childsId.childId2
    }
    if(child5_6){
        var parent5_6 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_6._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_11 = parent5_6.users[0].childsId.childId1
        var child6_12 = parent5_6.users[0].childsId.childId2
    }
    if(child5_7){
        var parent5_7 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_7._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_13 = parent5_7.users[0].childsId.childId1
        var child6_14 = parent5_7.users[0].childsId.childId2
    }
    if(child5_8){
        var parent5_8 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_8._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_15 = parent5_8.users[0].childsId.childId1
        var child6_16 = parent5_8.users[0].childsId.childId2
    }
    if(child5_9){
        var parent5_9 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_9._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_17 = parent5_9.users[0].childsId.childId1
        var child6_18 = parent5_9.users[0].childsId.childId2
    }
    if(child5_10){
        var parent5_10 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_10._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_19 = parent5_10.users[0].childsId.childId1
        var child6_20 = parent5_10.users[0].childsId.childId2
    }
    if(child5_11){
        var parent5_11 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_11._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_21 = parent5_11.users[0].childsId.childId1
        var child6_22 = parent5_11.users[0].childsId.childId2
    }
    if(child5_12){
        var parent5_12 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_12._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_23 = parent5_12.users[0].childsId.childId1
        var child6_24 = parent5_12.users[0].childsId.childId2
    }
    if(child5_13){
        var parent5_13 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_13._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_25 = parent5_13.users[0].childsId.childId1
        var child6_26 = parent5_13.users[0].childsId.childId2
    }
    if(child5_14){
        var parent5_14 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_14._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_27 = parent5_14.users[0].childsId.childId1
        var child6_28 = parent5_14.users[0].childsId.childId2
    }
    if(child5_15){
        var parent5_15 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_15._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_29 = parent5_15.users[0].childsId.childId1
        var child6_30 = parent5_15.users[0].childsId.childId2
    }
    if(child5_16){
        var parent5_16 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { user: child5_16._id }}})
        .populate('users.user')
        .populate('users.childsId.childId1')
        .populate('users.childsId.childId2')
        var child6_31 = parent5_16.users[0].childsId.childId1
        var child6_32 = parent5_16.users[0].childsId.childId2
    }

/* ------------------------/Nivel 5------------------------------------------------------------------------------- */

const allData = {
    child2_1,child2_2,
    child3_1,child3_2,child3_3,child3_4,
    child4_1,child4_2,child4_3,child4_4,child4_5,child4_6,child4_7,child4_8,
    child5_1,child5_2,child5_3,child5_4,child5_5,child5_6,child5_7,child5_8,child5_9,child5_10,child5_11,child5_12,child5_13,child5_14,child5_15,child5_16,
    child6_1,child6_2,child6_3,child6_4,child6_5,child6_6,child6_7,child6_8,child6_9,child6_10,child6_11,child6_12,child6_13,child6_14,child6_15,child6_16,child6_17,child6_18,child6_19,child6_20,child6_21,child6_22,child6_23,child6_24,child6_25,child6_26,child6_27,child6_28,child6_29,child6_30,child6_31,child6_32
}


res.json(allData)
})

module.exports = router 