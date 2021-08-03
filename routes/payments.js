const express = require('express')
const router = express.Router()
const verifyTokenAdmin = require('../Middlewares/verifyTokenAdmin')
const request = require('request')
const userModel = require('../models/Users')
const withdrawModel = require('../models/Withdraw')
const verifyToken = require('../Middlewares/verifyToken')
const Decimal = require('decimal.js-light')
const balanceUserModel = require('../models/BalanceUser')
const csrf = require('csurf')

const csrfProtection = csrf({ 
  cookie: true 
})

const myIdWallet = process.env.ID_MYWALLET
const xpub = process.env.XPUB
const signatureId = process.env.SIGNATURE_ID
const apiKey= process.env.BTCAPIKEY

/* ------------------------------------------------------------------------------------------------------- */
router.post('/api/sendbtc', csrfProtection, verifyToken, async(req, res) => {
  try{

    const { address, amount, password } = req.body
 
    if(address.length > 60){ return res.json({error: 'Invalid address'})}
    if(amount.length > 16){ return res.json({error: 'Invalid amount'})}

    const amountNumber = parseFloat(amount)
 
    const user = await userModel.findById(req.userToken, { userName: 1, wallet:1, idWallet: 1, password:1 })

    if(user.wallet < amountNumber){return res.json({error: 'you dont have enough money'})}

    const passwordValidate = await user.matchPassword(password)
    
    if (!passwordValidate){
      return res.json({error: 'Password is incorrect'})
    }

    const fee = '0.0001'
    const amountWithFee = new Decimal(parseFloat(amount)).sub(parseFloat(fee)).toNumber()

    const options = {
      url: 'https://api-eu1.tatum.io/v3/offchain/bitcoin/transfer',
      method: 'POST',
      body: JSON.stringify({
        senderAccountId: user.idWallet,
        address: address,
        amount: amountWithFee.toString(),
        fee: fee,
        signatureId: signatureId,
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

        const signatureId = data.signatureId
        
        user.wallet = new Decimal(user.wallet).sub(amountNumber).toNumber()

        const newWithdraw = new balanceUserModel({ 
          user: user.userName, 
          type: 'withdrawBtc', 
          withdraw: true,
          signatureId: signatureId,
          toAddress: address,
          totalAmount: amountNumber,
          withdrawAmount: amountWithFee,  
          fee: parseFloat(fee),  
          wallet: user.wallet
        })
        
        await newWithdraw.save()
        await user.save()

        res.json({msg: 'BTC Sent'})
      
    })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendinternalbtc', csrfProtection, verifyToken, async(req, res) => {
  try{

    const { amount, username, password } = req.body

    if(username.length > 16){ return res.json({error: 'Invalid username'})}
    if(amount.length > 16){ return res.json({error: 'Invalid amount'})}

    const user = await userModel.findById(req.userToken, { userName: 1, idWallet: 1, wallet: 1, password:1 })

    const passwordValidate = await user.matchPassword(password)
    
    if (!passwordValidate){
      return res.json({error: 'Password is incorrect'})
    }

    const userRecipient = await userModel.findOne({userName: username}, { userName: 1, firstDeposit: 1, idWallet: 1, wallet: 1, reserveWallet: 1 })

    const amountNumber = parseFloat(amount)

    if(!userRecipient){ return res.json({error: 'The username does not exist'}) }

    if(user.wallet < amountNumber){ return res.json({error: 'Insufficient balance'}) }

    const options = {
      url: 'https://api-eu1.tatum.io/v3/ledger/transaction',
      method: 'POST',
      body: JSON.stringify({
        senderAccountId: user.idWallet,
        recipientAccountId: userRecipient.idWallet,
        amount: amount,
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

      if(data.reference){

        user.wallet = new Decimal(user.wallet).sub(amountNumber).toNumber()

        let depositAmount = amountNumber

        if(userRecipient.firstDeposit === true){ 
          depositAmount = new Decimal(amountNumber).sub(0.00002).toNumber()
          userRecipient.reserveWallet = 0.00002
          userRecipient.firstDeposit = false
        }
        
        userRecipient.wallet = new Decimal(userRecipient.wallet).add(depositAmount).toNumber()

        const newWithdraw = new balanceUserModel({ 
          user: user.userName, 
          type: 'withdrawToUser', 
          withdraw: true, 
          reference: data.reference,
          toUser: userRecipient.userName,
          withdrawAmount: amountNumber,  
          wallet: user.wallet
        })

        const newDeposit = new balanceUserModel({
          user: userRecipient.userName,
          type: 'deposit',
          reference: data.reference,
          fromUser: user.userName,
          wallet: userRecipient.wallet,
          depositAmount: depositAmount,
        })

        await user.save()
        await userRecipient.save()
        await newWithdraw.save()
        await newDeposit.save()

        res.json({msg: 'withdrawal completed'})

      }
    })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/notificationbtc', async(req, res) => {
  try{

    const { accountId, txId, amount } = req.body

    const repited = await balanceUserModel.findOne({txId: txId}, {txId: 1})
    
    if(repited){ return res.status(200).json({msg: 'OK'}) }

    const user = await userModel.findOne({idWallet: accountId}, { wallet: 1, userName: 1, firstDeposit: 1 })

    const amountNumber = parseFloat(amount)

    let depositAmount = amountNumber

    if(user.firstDeposit === true){ 
      depositAmount = new Decimal(depositAmount).sub(0.00002).toNumber()
      user.firstDeposit = false
    }

    user.wallet = new Decimal(user.wallet).add(depositAmount).toNumber()
    
    const newBalance = await new balanceUserModel({ 
      user: user.userName,
      type: 'deposit',
      depositBtc: true,
      wallet: user.wallet,
      depositAmount: depositAmount,
      txId: txId
    })
    
    await user.save()
    await newBalance.save()

    res.status(200).json({msg: 'OK'})

  }catch(error){
    console.log(error)
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/cancelWithdraw', /* csrfProtection, verifyTokenAdmin, */ async(req, res) => {
  try{

    const { id } = req.body

    const options = {
      url: `https://api-eu1.tatum.io/v3/kms/${id}`,
      method: 'GET',
      headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
      }
    }

    request(options, async function(err, response){

        if (err) res.json(err)

        const data = JSON.parse(response.body)
        const withdrawalId = data.withdrawalId
        
        const options2 = {
          url: `https://api-eu1.tatum.io/v3/offchain/withdrawal/${withdrawalId}?revert=true`,
          method: 'DELETE',
          headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
          }
        }
    
        request(options2 , async function(err, response2){
    
            if(err){ return res.json({error: 'Internal Error'}) }

            if(response2.statusCode < 300){ 

              return res.json({msg: 'Transaccion devuelta'}) 

            }else{ return res.json({error: 'Internal Error'})}
    
        })

    })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal Error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/tatumDetailUser', csrfProtection, verifyTokenAdmin, async(req, res) => {
  try{

    const { username, myWallet } = req.body
  
    let id 

    if(myWallet){

      id = myIdWallet

    }else{

      const user = await userModel.findOne({userName: username}, {idWallet: 1})

      if(!user){ return res.json({error: 'No exite el usuario'}) }

      id = user.idWallet

    }

    const options = {
      url: `https://api-eu1.tatum.io/v3/ledger/account/${id}`,
      method: 'GET',
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

      res.json(data.balance)

    })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal Error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/transactiondetail', /* csrfProtection, verifyTokenAdmin, */ async(req, res) => {
  try{

    const { id } = req.body

    const options = {
      url: `https://api-eu1.tatum.io/v3/kms/${id}`,
      method: 'GET',
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

      res.json({msg: data.txId})

    })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal Error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendinternaladmin', /* csrfProtection, verifyTokenAdmin, */ async(req, res) => {
  try{

    const { amount, senderAccount, recipientAccount } = req.body

    const senderUser = await userModel.findOne({userName: senderAccount}, { userName: 1, firstDeposit: 1, idWallet: 1, wallet: 1, reserveWallet: 1 })
    const recipientUser = await userModel.findOne({userName: recipientAccount}, { userName: 1, firstDeposit: 1, idWallet: 1, wallet: 1, reserveWallet: 1 })

    const amountNumber = parseFloat(amount)

    if(senderUser.wallet < amountNumber){ return res.json({error: 'el usuario no tiene fondos suficientes'}) }

    const options = {
      url: 'https://api-eu1.tatum.io/v3/ledger/transaction',
      method: 'POST',
      body: JSON.stringify({
        senderAccountId: senderUser.idWallet,
        recipientAccountId: recipientUser.idWallet,
        amount: amount,
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

      if(data.reference){

        senderUser.wallet = new Decimal(senderUser.wallet).sub(amountNumber).toNumber()

        let depositAmount = amountNumber

        if(recipientUser.firstDeposit === true){ 
          depositAmount = new Decimal(amountNumber).sub(0.00002).toNumber()
          recipientUser.reserveWallet = 0.00002
          recipientUser.firstDeposit = false
        }
        
        recipientUser.wallet = new Decimal(recipientUser.wallet).add(depositAmount).toNumber()

        const newWithdraw = new balanceUserModel({ 
          user: senderUser.userName, 
          type: 'withdrawToUser', 
          withdraw: true, 
          reference: data.reference,
          toUser: recipientUser.userName,
          withdrawAmount: amountNumber,  
          wallet: senderUser.wallet
        })

        const newDeposit = new balanceUserModel({
          user: recipientUser.userName,
          type: 'deposit',
          reference: data.reference,
          fromUser: senderUser.userName,
          wallet: recipientUser.wallet,
          depositAmount: depositAmount,
        })

        await newWithdraw.save()
        await newDeposit.save()
        await recipientUser.save()
        await senderUser.save()

        res.json({msg: 'transaction complete'})

      }

    })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal Error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendfromadmin', /* csrfProtection, verifyTokenAdmin, */ async(req, res) => {
  try{

    const { amount, recipientAccount } = req.body

    const recipientUser = await userModel.findOne({userName: recipientAccount}, { userName: 1, firstDeposit: 1, idWallet: 1, wallet: 1, reserveWallet: 1 })

    const amountNumber = parseFloat(amount)

    const options = {
      url: 'https://api-eu1.tatum.io/v3/ledger/transaction',
      method: 'POST',
      body: JSON.stringify({
        senderAccountId: myIdWallet,
        recipientAccountId: recipientUser.idWallet,
        amount: amount,
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

      if(data.reference){

        let depositAmount = amountNumber

        if(recipientUser.firstDeposit === true){ 
          depositAmount = new Decimal(amountNumber).sub(0.00002).toNumber()
          recipientUser.reserveWallet = 0.00002
          recipientUser.firstDeposit = false
        }
        
        recipientUser.wallet = new Decimal(recipientUser.wallet).add(depositAmount).toNumber()

        const newWithdrawAdmin = new withdrawModel({ 
          user: 'Allen', 
          type: true,
          txId: data.reference,
          toUser: recipientUser.userName,
          amount: amountNumber
        })

        
        const newDeposit = new balanceUserModel({
          user: recipientUser.userName,
          type: 'deposit',
          reference: data.reference,
          fromUser: '2wanted',
          wallet: recipientUser.wallet,
          depositAmount: depositAmount,
        })
        
        await newWithdrawAdmin.save()
        await newDeposit.save()
        await recipientUser.save()

        res.json({msg: 'transaction complete'})

      }

    })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal Error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendbtc2', /* csrfProtection, verifyTokenAdmin, */ async(req, res) => {
  try{

    const { amount, address } = req.body

      const options2 = {
        url: 'https://api-eu1.tatum.io/v3/offchain/bitcoin/transfer',
        method: 'POST',
        body: JSON.stringify({
          senderAccountId: myIdWallet,
          address: address,
          amount: amount,
          fee: '0.00007',
          signatureId: signatureId,
          xpub: xpub
        }),
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
  
      request(options2, async function(err2, response2){
  
        if(err2){return res.json({error2: 'Internal error'})} 
  
        const data2 = JSON.parse(response2.body)
  
        if(data2.statusCode && data2.statusCode >= 400){ 
          return res.json({error2: `${data2.message} -Api tatum, Error ${data2.statusCode}-`})
        }
  
        res.json(data2)
  
      })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal Error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/cancelWithdraw2', /* csrfProtection, verifyTokenAdmin, */ async(req, res) => {
  try{

    const { id } = req.body
        
        const options2 = {
          url: `https://api-eu1.tatum.io/v3/offchain/withdrawal/${id}`,
          method: 'DELETE',
          headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json'
          }
        }
    
        request(options2 , async function(err, response2){
    
            if(err){ return res.json({error: 'Internal Error'}) }

            if(response2.statusCode < 300){ 

              return res.json({msg: 'Transaccion devuelta'}) 

            }else{ return res.json({error: 'Internal Error'})}
    
        })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal Error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
module.exports = router