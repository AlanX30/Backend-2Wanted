const express = require('express')
const router = express.Router()
const verifyTokenAdmin = require('../Middlewares/verifyTokenAdmin')
const Decimal = require('decimal.js-light')
const balanceUserModel = require('../models/BalanceUser')
const request = require('request')
const csrf = require('csurf')
const salasModel = require('../models/Salas')
const withdrawModel = require('../models/Withdraw')
const userModel = require('../models/Users')

/* ------------------------------------------------------------------------------------------------------- */
const xpub = process.env.XPUB
const mnemonic = process.env.MNEMONIC
const apiKey= process.env.BTCAPIKEY
const id_myWallet= process.env.ID_MYWALLET

let ActualtotalWon = 0
let actual2wanted = 0

router.post('/api/admin/generalTotalBalance', verifyTokenAdmin, async(req, res) => {

    try{
        
        const sumaDeposits = await balanceUserModel.aggregate([{$match: {depositBtc : true}}, {$group: {
            _id: null,
            suma: {$sum: '$depositAmount'}
        }}])
    
        let totalDeposits = 0
        
        if(sumaDeposits.length > 0){ 
            totalDeposits = sumaDeposits[0].suma
        }
    
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

        const egresos = new Decimal(totalEgreso2wanted).add(totalEgresoUsers).toNumber()
        
        const actualEnCuenta = new Decimal(totalDeposits).sub(egresos).toNumber()
        console.log( egreso2wanted, egresos, actualEnCuenta )
        /* ---------------------------------------------------------------------------------------------------------------- */
    
        const balance = await salasModel.find({}, {users: 0, creator: 0})
    
        let totalWon = 0
        let totalDepositSala = 0
        let totalPaidUsers = 0
        
        for(let i = 0; i < balance.length; i++){

            let balanceSala = new Decimal(balance[i].price).mul(balance[i].usersNumber).toNumber()
    
            totalDepositSala = new Decimal(totalDepositSala).add(balanceSala).toNumber()
                
            totalPaidUsers = new Decimal(totalPaidUsers).add(balance[i].paidUsers).toNumber()
        
            let line123 = new Decimal(balance[i].price).mul(balance[i].line123).toNumber()

            let divide1 = new Decimal(balance[i].price).div(2).toNumber()
            let divide2 = new Decimal(balance[i].price).div(4).toNumber()

            let line4 = new Decimal(divide1).mul(balance[i].line4).toNumber()

            let nextLinesUsers = new Decimal(balance[i].usersNumber).sub(balance[i].line123).sub(balance[i].line4).toNumber()

            let nextLines = new Decimal(divide2).mul(nextLinesUsers).toNumber()
            
            let total = new Decimal(line123).add(line4).add(nextLines).toNumber()
    
            totalWon = new Decimal(totalWon).add(total).toNumber()

            ActualtotalWon = totalWon
          
        }
    
        /* ---------------------------------------------------------------------------------------------------------------- */
        
        const pagadoSala = new Decimal(totalPaidUsers).add(totalWon).toNumber() 
        const userMoneyRooms = new Decimal(totalDepositSala).sub(pagadoSala).toNumber()
            
        /* ---------------------------------------------------------------------------------------------------------------- */
            
        const sumaWallets = await userModel.aggregate([{$group: {
            _id: null,
            suma: {$sum: '$wallet'}
        }}])
    
        let totalInWallets = 0
    
        if(sumaWallets.length > 0){ totalInWallets = sumaWallets[0].suma }

        const sumaReserve = await userModel.aggregate([{$group: {
            _id: null,
            suma: {$sum: '$reserveWallet'}
        }}])
    
        let reserve = 0
    
        if(sumaReserve.length > 0){ reserve = sumaReserve[0].suma }
    
        /* ---------------------------------------------------------------------------------------------------------------- */
        
        actual2wanted = new Decimal(totalWon).sub(totalEgreso2wanted).toNumber()

        const actual = new Decimal(actual2wanted).add(userMoneyRooms).add(totalInWallets).add(reserve).toNumber()

        let verification
        
        if(actual === actualEnCuenta){verification = 'Balanceado'}else{verification = 'Desbalance'}
 
        res.json({egresos, totalDeposits, actualEnCuenta, totalWon, userMoneyRooms, totalInWallets, actual2wanted, totalEgresoUsers, totalEgreso2wanted, verification, verification2: actual})

    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------------------- */

let disponible = 0

router.post('/api/admin/user2wanted_withdraw', verifyTokenAdmin, async(req, res) => {

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
              mnemonic: mnemonic,
              xpub: xpub
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
                
            const amountNumber = parseFloat(amount)
    
            const newWithdraw = new withdrawModel({ 
                user: user, 
                txId: data.txId,
                withdrawId: data.id,
                toAddress: address,
                amount: amountNumber
            })
    
            await newWithdraw.save()
    
            res.json({msg: 'BTC Sent'})

        })
    
    }catch(error){
        console.log(error)
        return res.json({error: 'Internal Error'})
    }
    
})

/* ------------------------------------------------------------------------------------------------------- */

module.exports = router