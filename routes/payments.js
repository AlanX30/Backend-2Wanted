const express = require('express')
const router = express.Router()
const request = require('request');
const userModel = require('../models/Users')
const verifyToken = require('../Middlewares/verifyToken')
const balanceUserModel = require('../models/BalanceUser')

const xpub = process.env.XPUB
const signatureId = process.env.SIGNATURE_ID
const apiKey= process.env.BTCAPIKEY

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendbtc', verifyToken, async(req, res) => {
  try{

    const user = await userModel.findById(req.userToken, { idWallet: 1 })

    const { address, amount } = req.body

    const options = {
      url: 'https://api-eu1.tatum.io/v3/offchain/bitcoin/transfer',
      method: 'POST',
      body: JSON.stringify({
        senderAccountId: user.idWallet,
        address: address,
        amount: amount,
        fee: "0.00005",
        signatureId: signatureId,
        xpub: xpub
      }),
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    }
  
    request(options, function(err, response){

        if (err) console.log(err)

        const signatureId = JSON.parse(response.body).signatureId

        const options2 = {
          url: `https://api-eu1.tatum.io/v3/kms/${signatureId}`,
          method: 'GET',
          headers: {
              'x-api-key': apiKey
          }
        }
      
        request(options2, async function(err, response2){

            if (err) console.log(err)
            
            const txId = JSON.parse(response2.body).txId
            const amountNumber = parseFloat(amount)

            /* user.wallet = user.wallet - amountNumber */

            const newWithdraw = new balanceUserModel({ 
              user: user.userName, 
              type: 'withdraw', 
              txId: txId,
              toAddress: address,
              withdrawAmount: amountNumber,  
              wallet: user.wallet
            })

            await newWithdraw.save()
            await user.save()

            res.json({msg: 'BTC Sent'})
        })
    })

  }catch(error){
    console.log(error)
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendinternalbtc', verifyToken, async(req, res) => {
  try{

    const { amount, username } = req.body

    const user = await userModel.findById(req.userToken, { userName: 1, idWallet: 1, wallet: 1 })
    const userRecipient = await userModel.findOne({userName: username}, { userName: 1, idWallet: 1, wallet: 1 })
    const amountNumber = parseFloat(amount)

    if(!userRecipient){ return res.json({error: 'The username does not exist'}) }

    /* if(user.wallet < amountNumber){ return res.json({error: 'Insufficient balance'}) } */

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

      if (err) console.log(err)
      
      const data = JSON.parse(response.body)

      if(data.reference){

        /* user.wallet = user.wallet - amountNumber

        userRecipient.wallet = userRecipient.wallet + amountNumber */

        const newWithdraw = new balanceUserModel({ 
          user: user.userName, 
          type: 'withdraw', 
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
          depositAmount: amountNumber,
        })

        await newWithdraw.save()
        await newDeposit.save()

        res.json({msg: 'withdrawal completed'})

      }
    })

  }catch(error){
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */


router.post('/api/notificationbtc', async(req, res) => {
  try{

    const { accountId, txId, amount } = req.body

    const repited = await balanceUserModel.findOne({txId: txId}, {txId: 1})

    if(repited){ return }

    const user = await userModel.findOne({idWallet: accountId}, { wallet: 1, userName: 1, firstDeposit: 1 })

    let depositAmount = parseFloat(amount)

    if(user.firstDeposit === true){ 
      depositAmount = depositAmount - 0.00002 
      user.firstDeposit = false
    }

    user.wallet = user.wallet + depositAmount
        
    const newBalance = await new balanceUserModel({ 
      user: user.userName,
      type: 'deposit',
      wallet: user.wallet,
      depositAmount: depositAmount,
      txId: txId
    })
        
    await user.save()
    await newBalance.save()

  }catch(error){
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/transactiondetail', async(req, res) => {

  const { signatureId } = req.body

  const options = {
    url: `https://api-eu1.tatum.io/v3/kms/${signatureId}`,
    method: 'GET',
    headers: {
        'x-api-key': apiKey
    }
  }

  request(options,function(err, response){
      if (err) console.log(err)
      
      res.json(JSON.parse(response.body))
  })

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
  
    request(options,function(err, response){
        if (err) console.log(err)
        console.log(JSON.parse(response.body))
        res.json(JSON.parse(response.body))
    })

  }catch(error){
    console.log(error.data)
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/DELETECC', async(req, res) => {
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
        if (err) console.log(err)
        console.log(response)
        res.json(response)
    })

    

  }catch(error){
    console.log(error.data)
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */
module.exports = router