const express = require('express')
const router = express.Router()
const safe = require('safe-regex')
const request = require('request')
const Decimal = require('decimal.js-light')
const csrf = require('csurf')
const salasModel = require('../models/Salas')
const verifyToken = require('../Middlewares/verifyToken')
const positions = require('../Middlewares/positions')
const userModel = require('../models/Users')
const balanceUserModel = require('../models/BalanceUser')

const reg_whiteSpace = /^$|\s+/

const myIdWallet = process.env.ID_MYWALLET
const apiKey= process.env.BTCAPIKEY

const csrfProtection = csrf({ 
    cookie: true 
})

router.post('/api/new/sala', csrfProtection, verifyToken ,async(req, res) => {
    try {

        const { name, password, price } = req.body

        if(price.length > 16){ return res.json({error: 'Invalid amount'})}

        if(name.length < 4 || name.length > 15){
            return res.json({error: 'The name must have more than 3 characters, maximum 15, must not have spaces'})
        }

        const priceNumber = parseFloat(price)

        const user = await userModel.findById(req.userToken, {idWallet: 1, userName: 1, wallet: 1, password: 1})

        const passwordValidate = await user.matchPassword(password)
    
        if (!passwordValidate){
            return res.json({error: 'Password is incorrect'})
        }

        const creator = user.userName
        const users = [
            {
                user: creator,
                parentId: undefined,
                childsId: {
                    childId1: '',
                    childId2: '',
                }
            }
        ]

        const newSala = await new salasModel({ users, price, name, creator, usersNumber: 1, paidUsers: 0, line123: 1, line4: 0 })
        const repitedName = await salasModel.findOne({name: name}, {name: 1})
 
        if(user.wallet < priceNumber){
            return res.json({error: 'Insufficient money in wallet'})
        }
        
        if(repitedName) {
            return res.json({error: 'A room with this name already exists'})
        }

        if(safe(reg_whiteSpace.test(name))){
            if (reg_whiteSpace.test(name)){
                return res.json({error: 'The name must have more than 3 characters, maximum 15, must not have spaces'})
            }
        }else{ return res.json({error: 'Internal error'}) }

        if(priceNumber < 0.00005 || price === '' || price === undefined ){
            return  res.json({error: 'Minimum room value 0.00005 BTC'})
        }

        const options = {
            url: 'https://api-eu1.tatum.io/v3/ledger/transaction',
            method: 'POST',
            body: JSON.stringify({
              senderAccountId: user.idWallet,
              recipientAccountId: myIdWallet,
              amount: price,
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

            user.wallet = new Decimal(user.wallet).sub(priceNumber).toNumber()

            const balanceSala = await new balanceUserModel({ 
                user: user.userName,
                salaName: newSala.name,
                salaId: newSala._id,
                salaActive: true,
                salaCreator: creator,
                salaRepeat: 0,
                salaPrice: priceNumber,
                accumulated: 0,
                usersNumber: 0,
                type: 'buy',
                wallet: user.wallet,
            })
        
            await user.save()
            await newSala.save()
            await balanceSala.save()

            res.json({msg: 'Correctly created room', id: newSala._id})

        })

    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
})

router.post('/api/search/sala', csrfProtection, verifyToken, async(req, res) =>{
    
    try{

        const { name, salaId } = req.body
        
        if(name) {

            if(name.length > 15){ return res.json({error: 'Invalid name'})}

            if(safe(reg_whiteSpace.test(name))){
                if (reg_whiteSpace.test(name)){
                    return res.json({error: 'Must not contain spaces'})
                }
            }else{ return res.json({error: 'Internal error'}) }

        }

        const salabyName = await salasModel.findOne({name: name}, {users:0})

        if(salabyName){
            return res.json({data: salabyName})
        }
        
        const salaById = await salasModel.findById( salaId, {users:0})
   
        if(salaById){

            const userToken = await userModel.findById(req.userToken, {userName: 1})

            const parent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { $and: [ {user: userToken.userName}, {active: true} ] }}})

            const parentUser = parent.users[0].parentId ? parent.users[0].parentId : 'Ninguno'

            const balanceUser = await balanceUserModel.findOne({salaName: salaById.name, user: userToken.userName}, {accumulated: 1}).sort({date: -1})

            return res.json({data: salaById, parentId: parentUser, inBalance: balanceUser.accumulated})
        }
            
        res.json({error: 'This room does not exist'})
        
    }
    catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
    
})

router.post('/api/search/listSalas', csrfProtection, verifyToken, async(req, res) => {
    
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
        console.log(error)
        res.json({error: 'Internal error'})
    }
})

router.post('/api/newUserInSala', csrfProtection, verifyToken, async(req, res, next) => {
    
    try {

        const { salaId, random, password } = req.body

        const user = await userModel.findById(req.userToken, {wallet: 1, idWallet: 1, userName: 1, password: 1})

        const passwordValidate = await user.matchPassword(password)
    
        if (!passwordValidate){
            return res.json({error: 'Password is incorrect'})
        }

        let parentUser
        
        if(random){

            const randomParent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { space: true }}})

            parentUser = randomParent.users[0].user
            
        }else{
            if(req.body.parentUser.length > 16){ return res.json({error: 'Invalid parent user'})}
            parentUser = req.body.parentUser 
        } 
        
        const price = await salasModel.findById(salaId, {usersNumber: 1, price: 1, name: 1, creator: 1})
        const parent = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { $and: [ {user: parentUser}, {active: true} ] }}})    
        const repitedUser = await salasModel.findOne({_id: salaId}, {users: {$elemMatch: { $and: [ {user: user.userName}, {last: true} ] }}})
        console.log(repitedUser.users[0])
        let countRepeated = 0

        if(repitedUser.users.length > 0){
            if(repitedUser.users[0].active === true) {
                return res.json({error: 'You are currently active in this room, you can re-enter when completing it'})
            }else if(repitedUser.users[0].active === false){
                countRepeated = repitedUser.users[0].repeated + 1
                repitedUser.users[0].last = false
            }
        }
        
        if(user.wallet < price.price){
            return res.json({error: 'Not enough money'})
        }
        if(parent.users.length === 0){
            return res.json({error: 'There is no parent user in this room'})
        }

        if(parent.users[0].childsId.childId1 === ''){
            parent.users[0].childsId.childId1 = `${user.userName} ${countRepeated}` 
        }else if (parent.users[0].childsId.childId2 === ''){
            parent.users[0].space = false
            await parent.save()
            parent.users[0].childsId.childId2 = `${user.userName} ${countRepeated}` 
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
                    last: true,
                    repeated: countRepeated
                }
            }
        }) 

        price.usersNumber = price.usersNumber + 1

        /* const options = {
            url: 'https://api-eu1.tatum.io/v3/ledger/transaction',
            method: 'POST',
            body: JSON.stringify({
              senderAccountId: user.idWallet,
              recipientAccountId: myIdWallet,
              amount: price.price.toString(),
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
            } */

            user.wallet = new Decimal(user.wallet).sub(price.price).toNumber()
            
            const balanceSala = await new balanceUserModel({ 
                user: user.userName,
                salaName: price.name,
                salaId: salaId,
                salaCreator: price.creator,
                salaActive: true,
                salaRepeat: countRepeated,
                accumulated: 0,
                type: 'buy',
                wallet: user.wallet,
                salaPrice: price.price,
            })
            
            positions(req)
            
            await repitedUser.save()
            await user.save()
            await parent.save()
            await balanceSala.save()
            await price.save()
        
            res.json({msg: 'User added successfully', id: salaId})

        /* }) */
        
    }catch(error){
        console.log(error)
        res.json({error: 'Internal error'})
    }
})

module.exports = router