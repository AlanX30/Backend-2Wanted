const express = require('express')
const router = express.Router()
const verifyTokenAdmin = require('../Middlewares/verifyTokenAdmin')
const balanceUserModel = require('../models/BalanceUser')
const request = require('request')
const csrf = require('csurf')
const salasModel = require('../models/Salas')
const withdrawModel = require('../models/Withdraw')
const userModel = require('../models/Users')

/* ------------------------------------------------------------------------------------------------------- */
const xpub = process.env.XPUB
const signatureId = process.env.SIGNATURE_ID
const apiKey= process.env.BTCAPIKEY
const id_myWallet= process.env.ID_MYWALLET

const csrfProtection = csrf({ 
    cookie: true 
})

let ActualtotalWon = 0
let actual2wanted = 0

router.post('/api/admin/generalTotalBalance', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const sumaDeposits = await balanceUserModel.aggregate([{$match: {depositBtc : true}}, {$group: {
            _id: null,
            suma: {$sum: '$depositAmount'}
        }}])
    
        let totalDeposits = 0
        
        if(sumaDeposits.length > 0){ totalDeposits = sumaDeposits[0].suma }
    
        /* ---------------------------------------------------------------------------------------------------------------- */
    
        const egreso2wanted = await withdrawModel.aggregate([{$match: {type : true}}, {$group: {
            _id: null,
            suma: {$sum: '$amount'}
        }}])
    
        const egresoUsers = await balanceUserModel.aggregate([{$match: {type : 'withdrawBtc'}}, {$group: {
            _id: null,
            suma: {$sum: '$totalAmount'}
        }}])
    
        let totalEgreso2wanted = 0
        let totalEgresoUsers = 0
    
        if(egreso2wanted.length > 0){ totalEgreso2wanted = egreso2wanted[0].suma }
        if(egresoUsers.length > 0){ totalEgresoUsers = egresoUsers[0].suma }
    
        const actualEnCuenta = totalDeposits - (totalEgreso2wanted + totalEgresoUsers)
    
        /* ---------------------------------------------------------------------------------------------------------------- */
    
        const balance = await salasModel.find({}, {users: 0, creator: 0})
    
        let totalWon = 0
        let totalDepositSala = 0
        let totalPaidUsers = 0
        
        for(let i = 0; i < balance.length; i++){
    
            totalDepositSala = totalDepositSala + (balance[i].price * balance[i].usersNumber)
                
            totalPaidUsers = totalPaidUsers + balance[i].paidUsers
        
            let line123 = balance[i].price * balance[i].line123
            let line4 = (balance[i].price / 2) * balance[i].line4
            let nextLines = (balance[i].price / 4) * (balance[i].usersNumber - balance[i].line123 - balance[i].line4)
    
            let total = line123 + line4 + nextLines
    
            totalWon = totalWon + total

            ActualtotalWon = totalWon
          
        }
    
        /* ---------------------------------------------------------------------------------------------------------------- */
            
        const userMoneyRooms = totalDepositSala - (totalPaidUsers + totalWon)
            
        /* ---------------------------------------------------------------------------------------------------------------- */
            
        const sumaWallets = await userModel.aggregate([{$group: {
            _id: null,
            suma: {$sum: '$wallet'}
        }}])
    
        let totalInWallets = 0
    
        if(sumaWallets.length > 0){ totalInWallets = sumaWallets[0].suma }
    
        /* ---------------------------------------------------------------------------------------------------------------- */
        
        actual2wanted = totalWon - totalEgreso2wanted

        const actual = actual2wanted + userMoneyRooms + totalInWallets

        let verification

        if(actual === actualEnCuenta){verification = 'En orden'}else{verification = 'Inconsistencia'}
        console.log({
            actual, actualEnCuenta, actual2wanted, userMoneyRooms, totalInWallets
        })
        res.json({totalDeposits, actualEnCuenta, totalWon, userMoneyRooms, totalInWallets, actual2wanted, totalEgresoUsers, totalEgreso2wanted, verification})

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------------------- */

let disponible = 0

router.post('/api/admin/user2wanted_withdraw', csrfProtection, verifyTokenAdmin, async(req, res) => {

    try{
        
        const { user, verification, address, amount } = req.body 
        
        if(user === 'Michael' || user === 'Allen' || user === 'Yisus'){}else{ return res.json({error: 'Usuario inexistente'}) }
        
        let userTotal = 0

        if(verification){

            const egresoUsers = await withdrawModel.aggregate([{$match: {user : user}}, {$group: {
                _id: null,
                suma: {$sum: '$amount'}
            }}])

            if(egresoUsers.length > 0){
                userTotal = egresoUsers[0].suma
            }

            if(user === 'Michael'){ 
                disponible = (ActualtotalWon * 0.05) - userTotal
                return res.json({user: 'Michael', available: disponible, used: userTotal})
            }
            if(user === 'Allen'){ 
                disponible = (ActualtotalWon * 0.50) - userTotal
                return res.json({user: 'Allen', available: disponible, used: userTotal})
            }
            if(user === 'Yisus'){ 
                disponible = (ActualtotalWon * 0.45) - userTotal
                return res.json({user: 'Yisus', available: disponible, used: userTotal})
            }   
        }

        if(disponible < amount){ return res.json({error: 'No tienes fondos deja la viveza'})}

        const fee = '0.00015'
        const amountWithFee = parseFloat(amount) - parseFloat(fee)

        const options = {
            url: 'https://api-eu1.tatum.io/v3/offchain/bitcoin/transfer',
            method: 'POST',
            body: JSON.stringify({
              senderAccountId: id_myWallet,
              address: address,
              amount: amountWithFee,
              fee: fee,
              signatureId: signatureId,
              xpub: xpub
            }),
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
            }
        }
        
        request(options, function(err, response){
      
            if(err){return res.json({error: 'Internal error'})} 
      
            const data = JSON.parse(response.body)
      
            if(data.statusCode && data.statusCode >= 400){ 
                return res.json({error: `${data.message} -Api tatum, Error ${data.statusCode}-`})
            }
      
            const signatureId = data.signatureId
      
            const options2 = {
                url: `https://api-eu1.tatum.io/v3/kms/${signatureId}`,
                method: 'GET',
                headers: {
                    'x-api-key': apiKey
                }
            }

            request(options2, async function(err2, response2){

                if(err2){return res.json({error: 'Internal Error'})} 
    
                const data2 = JSON.parse(response2.body)
        
                if(data2.statusCode && data2.statusCode >= 400){ 
                  return res.json({error: `${data2.message} -Api tatum, Error ${data2.statusCode}-`})
                }
                
                const txId = data2.txId
                const amountNumber = parseFloat(amount)
    
                const newWithdraw = new withdrawModel({ 
                  user: user, 
                  txId: txId,
                  toAddress: address,
                  amount: amountNumber
                })
    
                await newWithdraw.save()
    
                res.json({msg: 'BTC Sent'})
            })
        })    
            

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */

module.exports = router