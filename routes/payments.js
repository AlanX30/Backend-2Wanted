const express = require('express')
const router = express.Router()
const verifyTokenAdmin = require('../Middlewares/verifyTokenAdmin')
const request = require('request')
const userModel = require('../models/Users')
const verifyToken = require('../Middlewares/verifyToken')
const Decimal = require('decimal.js-light')
const balanceUserModel = require('../models/BalanceUser')
const csrf = require('csurf')

const csrfProtection = csrf({ 
  cookie: true 
})

const myIdWallet = process.env.ID_MYWALLET
const xpub = process.env.XPUB
const mnemonic = process.env.MNEMONIC
const apiKey= process.env.BTCAPIKEY

/* NO HAY FUNCIONES DE CANCELAR RETIRO */

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
        
        user.wallet = new Decimal(user.wallet).sub(amountNumber).toNumber()

        const newWithdraw = new balanceUserModel({ 
          user: user.userName, 
          type: 'withdrawBtc', 
          withdraw: true,
          withdrawId: data.id,
          txId: data.txId,
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
module.exports = router