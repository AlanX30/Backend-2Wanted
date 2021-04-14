const express = require('express')
const router = express.Router()
const csrf = require('csurf')
const salasModel = require('../models/Salas')
const Decimal = require('decimal.js-light')
const userModel = require('../models/Users')
const balanceUserModel = require('../models/BalanceUser')
const verifyToken = require('../Middlewares/verifyToken')

const myIdWallet = process.env.ID_MYWALLET

const csrfProtection = csrf({ 
    cookie: true 
})

router.post('/api/in-sala', csrfProtection, verifyToken, async(req, res) => {  

    const userToken = await userModel.findById(req.userToken, {userName: 1, idWallet: 1,})

    const salaId = req.query.id 
    const userRoot = userToken.userName
    const toBalance = req.body.toBalance

    /* ------------------------Nivel 1------------------------------------------------------------------------------- */

    try{
    
        var parent1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { $and: [ {user: userRoot}, {active: true} ] }}})

        if(parent1.users.length === 0 ){ return res.json({error: 'You dont belong in this room'}) }

        var child2_1 = parent1.users[0].childsId.childId1
        var child2_2 = parent1.users[0].childsId.childId2
    
        /* ------------------------/Nivel 1------------------------------------------------------------------------------- */
        
        /* ------------------------Nivel 2------------------------------------------------------------------------------- */
        if(child2_1){
            var parent2_1 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { $and: [ {user: child2_1}, {active: true} ] }}})
      
            
            var child3_1 = parent2_1.users[0].childsId.childId1
            var child3_2 = parent2_1.users[0].childsId.childId2
        }
        if(child2_2){
            var parent2_2 = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { $and: [ {user: child2_2}, {active: true} ] }}})
         
    
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
    
    if(toBalance === 'true'){
        const salaPrice = await salasModel.findById(salaId, {paidUsers: 1, price: 1, name: 1 })
        const balanceSala = await balanceUserModel.findOne({salaName: salaPrice.name, user: userRoot, salaRepeat: parent1.users[0].repeated}, {salaPrice: 1, accumulated: 1})
        .sort({date: -1})
        const user = await userModel.findOne({userName: userRoot}, { wallet: 1 })
    
        let acum3 = 0
        let acum4 = 0   
        
        for(let i = 6; i<=13; i++) {
            let divide = new Decimal(salaPrice.price).div(2).toNumber()  
            if(allData[i]){
                acum3 = new Decimal(acum3).add(divide).toNumber()
            }
        }
 
        for(let i = 14; i<=29; i++){
            let divide = new Decimal(salaPrice.price).div(4).toNumber() 
            if(allData[i]){
                acum4 = new Decimal(acum4).add(divide).toNumber()
            }
        }

        const tAcum = new Decimal(acum3).add(acum4).toNumber()
        let newCash = 0 
 
        if(tAcum > balanceSala.accumulated){
            newCash = new Decimal(tAcum).sub(balanceSala.accumulated).toNumber()
        }

        const full = new Decimal(salaPrice.price).mul(8).toNumber()
        
        if(newCash > 0){

            if(tAcum === full){
                const noActive = await balanceUserModel.findOne({salaName: salaPrice.name, user: userRoot, type: 'buy', salaRepeat: parent1.users[0].repeated}, {salaActive: 1})
                noActive.salaActive = false
                parent1.users[0].active = false

                await noActive.save()
                await parent1.save()
            }

            /* const options = {
                url: 'https://api-eu1.tatum.io/v3/ledger/transaction',
                method: 'POST',
                body: JSON.stringify({
                  senderAccountId: myIdWallet,
                  recipientAccountId: userRoot.idWallet,
                  amount: newCash.toString(),
                  anonymous: false,
                  baseRate: 1,
                }),
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }
            
            request(options, async function(err, response){
          
                if(err){return res.json({error: 'Internal error'})} 
          
                const data = JSON.parse(response.body)
          
                if(data.statusCode && data.statusCode >= 400){ 
                  return res.json({error: `${data.message} -Api tatum, Error ${data.statusCode}-`})
                }
    
            }) */
  
            user.wallet = new Decimal(user.wallet).add(newCash).toNumber()
            salaPrice.paidUsers = new Decimal(salaPrice.paidUsers).add(newCash).toNumber()

            const newBalance = await new balanceUserModel({ 
                user: userRoot,
                salaName: salaPrice.name,
                accumulated: tAcum,
                won: newCash,
                salaRepeat: parent1.users[0].repeated,
                type: 'won',
                wallet: user.wallet,
            })

            await salaPrice.save()
            await user.save()
            await newBalance.save()
            

            res.json({msg: 'Correct transaction'})
        }else{ return res.json({error: 'No money to pay'})}

    }else{
        res.json(allData)
    }
    }
    catch(error){
        console.log(error)
        res.json({error: 'Internal Error'})
    }
    
})
    
module.exports = router 