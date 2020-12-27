const express = require('express')
const router = express.Router()
const request = require('request');
const userModel = require('../models/Users')
const verifyToken = require('../Middlewares/verifyToken')
const balanceUserModel = require('../models/BalanceUser')

const xpub = process.env.XPUB
const mnemonic = process.env.MNEMONIC
const apiKey= process.env.BTCAPIKEY

router.post('/api/generateAddress', verifyToken, async(req, res) => {
  try{

    const user = await userModel.findById(req.userToken, { idWallet: 1 })

    const idWalletUser = user.idWallet

    const options = {
      url: `https://api-eu1.tatum.io/v3/offchain/account/${idWalletUser}/address`,
      method: 'POST',
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
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendbtc', verifyToken, async(req, res) => {
  try{

    const { address, amount } = req.body

    const user = await userModel.findById(req.userToken, { userName: 1, wallet: 1, idWallet: 1 })
    const options = {
      url: 'https://api-eu1.tatum.io/v3/offchain/withdrawal',
      method: 'POST',
      body: JSON.stringify({
        senderAccountId: user.idWallet,
        address: address,
        compliant: true,
        amount: amount,
        fee: "0.0000",
        mnemonic: mnemonic,
        xpub: xpub,
      }),
      headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
      }
    }
  
    request(options,function(err, response){
        if (err) console.log(err)

/*         const amountNumber = parseFloat(amount)

        user.wallet = user.wallet - amountNumber

        const newWithdraw = new balanceUserModel({ 
          user: user.userName, 
          type: 'withdraw', 
          reference: ,
          withdrawAmount: , 
          state: 'complete', 
          wallet: user.wallet
        })

        await user.save() */
        
        res.json(JSON.parse(response.body))
    })

  }catch(error){
    console.log(error)
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendbtc2', async(req, res) => {
  try{

    
    const options = {
      url: 'https://api-eu1.tatum.io/v3/bitcoin/transaction',
      method: 'POST',
      body: JSON.stringify({
        fromAddress: [
          {
            address: "199YXpkB6Y3FH45xnrnweiUmV1z4VdNY88",
            privateKey: process.env.PRIVATEWALLET
          }
        ],
        to: [
          {
            address: "bc1q2qn4x3j8hyrf7kfy50ftqrjy8kalgkzm2we2w6",
            value: 0.0018
          }
          ]
      }),
      headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
      }
    }
  
    request(options,function(err, response){
        if (err) console.log(err)
        
        res.json(JSON.parse(response.body))
    })
    
  }catch(error){
    console.log(error)
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/sendbtc3', async(req, res) => {

  const options = {
    url: `https://api-eu1.tatum.io/v3/offchain/withdrawal/5fe78099f03253e461a7e5b1/bed25b792449b148a60261ad1f9c1d7eac00f0d2ba0f1c0d0d7ee19b64816b84`,
    method: 'PUT',
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

router.post('/api/obtener', async(req, res) => {

    const options = {
      url: `https://api-eu1.tatum.io/v3/ledger/transaction/account?pageSize=50`,
      method: 'POST',
      body: JSON.stringify({
        id: '5fe78099f03253e461a7e5b1'
      }),
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

router.post('/api/sendinternalbtc', verifyToken, async(req, res) => {
  try{

    const { amount, username } = req.body

    const user = await userModel.findById(req.userToken, { userName: 1, idWallet: 1, wallet: 1 })
    const userRecipient = await userModel.findOne({userName: username}, { userName: 1, idWallet: 1, wallet: 1 })
    const amountNumber = parseFloat(amount)

    if(!userRecipient){ return res.json({error: 'El username destinatario no exite'}) }

    /* if(user.wallet < amountNumber){ return res.json({error: 'No tienes saldo suficiente'}) } */

    const options = {
      url: 'https://api-eu1.tatum.io/v3/ledger/transaction',
      method: 'POST',
      body: JSON.stringify({
        senderAccountId: user.idWallet,
        recipientAccountId: userRecipient.idWallet,
        amount: amount,
        anonymous: false,
        compliant: false,
        transactionCode: "1_01_EXTERNAL_CODE",
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
          withdrawAmount: amountNumber, 
          state: 'complete', 
          wallet: user.wallet
        })

        const newDeposit = new balanceUserModel({
          user: userRecipient.userName,
          type: 'deposit',
          reference: data.reference,
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

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/retirocompleto', async(req, res) => {
  try {

    /* const id = '5fe3aae45e1b219ed2af28b4'
    const txId = '5cf6bc4643c56a6746d9aaa9cc8a4e9eb643beaa59286e42463e04311fdb62d1'

    const options = {
      url: `https://api-eu1.tatum.io/v3/offchain/withdrawal/${id}/${txId}`,
      method: 'PUT',
      headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
      }
    }
  
    request(options,function(err, response){
        if (err) console.log(err)

        res.json(JSON.parse(response.body))
    }) */

  }catch(error){ res.json({error: 'Internal error'}) }
})
/* ------------------------------------------------------------------------------------------------------- */
router.post('/api/notificationbtc', async(req, res) => {
  try{

    const { accountId, txId, amount } = req.body

    const repited = await balanceUserModel.findOne({txId: txId}, {txId: 1})

    if(repited){ return }

    const user = await userModel.findOne({idWallet: accountId}, { wallet: 1, userName: 1 })

    user.wallet = user.wallet + amount
        
    const newBalance = await new balanceUserModel({ 
      user: user.userName,
      type: 'deposit',
      wallet: user.wallet,
      depositAmount: amount,
      txId: txId
    })
        
    await user.save()
    await newBalance.save()

  }catch(error){
    res.json({error: 'error'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/generateWallet', async(req, res) => {

  try{

    const options = {
      url: 'https://api-eu1.tatum.io/v3/bitcoin/wallet',
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
    res.json({error: 'Internal error'})
  }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/privateKey', async(req, res) => {
  try{

    const options = {
      url: 'https://api-eu1.tatum.io/v3/bitcoin/wallet/priv',
      method: 'POST',
      body: JSON.stringify({
        index: 1,
        mnemonic: 'meat soldier leisure pulse drastic kind under because athlete gravity tooth marriage zebra crouch wait harsh process reopen stove peasant siege afraid please hurdle'
      }),
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
    console.log(error)
    res.json({error: 'Error Interno'})
  }
})

/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/tatumaccount', async(req, res) => {
  try{

    const { id } = req.body

    const options = {
      url: `https://api-eu1.tatum.io/v3/ledger/account/${id}/balance`,
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
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/verifytransaction', async(req, res) => {
  try{

    const options = {
      url: 'https://api-eu1.tatum.io/v3/offchain/account/address/199YXpkB6Y3FH45xnrnweiUmV1z4VdNY88/BTC',
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
module.exports = router