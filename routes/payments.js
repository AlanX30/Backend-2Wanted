const express = require('express')
const router = express.Router()
const userModel = require('../models/Users')
const { v4: uuid } = require('uuid')
const verifyToken = require('../Middlewares/verifyToken')
const balanceUserModel = require('../models/BalanceUser')
const axios = require('axios')
const Client = require('coinbase').Client

router.post('/api/btcgetaddress', verifyToken , async(req, res) => {

  try{

    const user = await userModel.findById(req.userToken, {password: 0})

    if(!user){
      return res.json({error: 'You must be a registered user'})
    }

    const userUuid = uuid()

    const client = new Client({
      'apiKey': process.env.COINBASEKEY,
      'apiSecret': process.env.SECRETCOINBASE,
      'version':'2020-12-03'
    });

    let address = null

    client.getAccount(userUuid, function(err, account) {
      account.createAddress(function(err, addr) {
        console.log(addr);
        address = addr;
      });
    });

    res.json({address})

  }catch(error){
    res.json({error: 'Internal error'})
  }
    
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/', async(req, res) => {

  try{

    
      
  }catch(error){
    res.json({error: 'Error Interno'})
  }
})


/* ------------------------------------------------------------------------------------------------------- */

module.exports = router