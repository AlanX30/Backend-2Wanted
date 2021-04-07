const express = require('express')
const router = express.Router()
const request = require('request')
const userModel = require('../models/Users')
const verifyToken = require('../Middlewares/verifyToken')
const balanceUserModel = require('../models/BalanceUser')
const csrf = require('csurf')

const csrfProtection = csrf({ 
  cookie: true 
})

const xpub = process.env.XPUB
const signatureId = process.env.SIGNATURE_ID
const apiKey= process.env.BTCAPIKEY

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendbtc', csrfProtection, verifyToken, async(req, res) => {
  try{

    const { address, amount, password } = req.body
    console.log('Llego punto 1 envioBtc')
    if(address.length > 60){ return res.json({error: 'Invalid address'})}
    if(amount.length > 16){ return res.json({error: 'Invalid amount'})}

    const amountNumber = parseFloat(amount)
    console.log('Llego punto 2 envioBtc')
    const user = await userModel.findById(req.userToken, { userName: 1, wallet:1, idWallet: 1, password:1 })

    if(user.wallet < amountNumber){return res.json({error: 'you dont have enough money'})}

    const passwordValidate = await user.matchPassword(password)
    
    if (!passwordValidate){
      return res.json({error: 'Password is incorrect'})
    }

    const fee = '0.00004'
    const amountWithFee = parseFloat(amount) - parseFloat(fee)

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
        console.log('Llego punto 2 envioBtc', data)
        
        user.wallet = user.wallet - amountNumber

        const newWithdraw = new balanceUserModel({ 
          user: user.userName, 
          type: 'withdrawBtc', 
          withdraw: true,
          signatureId: signatureId,
          txId: txId,
          toAddress: address,
          withdrawAmount: amountNumber,  
          wallet: user.wallet
        })

        await newWithdraw.save()
        await user.save()

        res.json({msg: 'BTC Sent'})
        
        const options2 = {
          url: `https://api-eu1.tatum.io/v3/kms/${signatureId}`,
          method: 'GET',
          headers: {
              'x-api-key': apiKey
          }
        }

        setTimeout(

          request(options2, async function(err2, response2){

            if(err2){return res.json({error: 'Internal Error'})} 

            const data2 = JSON.parse(response2.body)
    
            if(data2.statusCode && data2.statusCode >= 400){ 
              return res.json({error: `${data2.message} -Api tatum, Error ${data2.statusCode}-`})
            }
            const txId = data2.txId
            console.log('Llego punto 3 envioBtc', data2)

            newWithdraw.txId = txId

            await newWithdraw.save()
            
        }),10000)
      
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
    console.log('Llego punto 1 envioUser')
    const user = await userModel.findById(req.userToken, { userName: 1, idWallet: 1, wallet: 1, password:1 })

    const passwordValidate = await user.matchPassword(password)
    
    if (!passwordValidate){
      return res.json({error: 'Password is incorrect'})
    }

    const userRecipient = await userModel.findOne({userName: username}, { userName: 1, firstDeposit: 1, idWallet: 1, wallet: 1 })

    const amountNumber = parseFloat(amount)
    console.log('Llego punto 2 envioUser')
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
      console.log('Llego punto 3 envioUser')
      if(data.reference){
        console.log('Llego punto 4 envioUser')
        user.wallet = user.wallet - amountNumber

        let depositAmount = amountNumber

        if(userRecipient.firstDeposit === true){ 
          depositAmount = amountNumber - 0.00002 
          userRecipient.firstDeposit = false
        }

        userRecipient.wallet = userRecipient.wallet + depositAmount
        console.log('Llego punto 5 envioUser')
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

    console.log('Llego punto 1 deposito' ,req.body)
    const repited = await balanceUserModel.findOne({txId: txId}, {txId: 1})
    if(repited){ return }

    const user = await userModel.findOne({idWallet: accountId}, { wallet: 1, userName: 1, firstDeposit: 1 })

    let depositAmount = parseFloat(amount)

    if(user.firstDeposit === true){ 
      depositAmount = depositAmount - 0.00002 
      user.firstDeposit = false
    }

    user.wallet = user.wallet + depositAmount
    console.log('Llego punto 2 deposito')    
    const newBalance = await new balanceUserModel({ 
      user: user.userName,
      type: 'deposit',
      depositBtc: true,
      wallet: user.wallet,
      depositAmount: depositAmount,
      txId: txId
    })
    console.log('Llego punto 3 deposito')     
    await user.save()
    await newBalance.save()

    res.status(200).json({msg: 'OK'})

  }catch(error){
    console.log(error)
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/tatumaccount', async(req, res) => {
  try{

    const { id } = req.body

    const options = {
      url: `https://api-eu1.tatum.io/v3/ledger/account/${id}`,
      method: 'GET',
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

        res.json(data)
    })

  }catch(error){
    console.log(error)
    res.json({error: 'Internal error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/DELETECC', csrfProtection, async(req, res) => {
  try{

    const { id } = req.body

    const options = {
      url: `https://api-eu1.tatum.io/v3/offchain/withdrawal/${id}?revert=true`,
      method: 'DELETE',
      headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
      }
    }

    request(options,function(err, response){

        if (err) res.json(err)

        res.json(response)
    })

    

  }catch(error){
    console.log(error)
    res.json({error: 'Internal Error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
module.exports = router