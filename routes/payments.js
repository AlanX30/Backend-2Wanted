const express = require('express')
const mercadopago = require('mercadopago')
const router = express.Router()
const userModel = require('../models/Users')
const verifyToken = require('./verifyToken')
const balanceUserModel = require('../models/BalanceUser')
const axios = require('axios')

mercadopago.configure({
    access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
})

router.post('/api/payments', verifyToken , async(req, res, next) => {

    const user = await userModel.findById(req.userToken, {password: 0})

    const price = parseFloat(req.body.price)

    let preference = {
        items: [
          {
            title: 'Recarga De 2Wanted',
            unit_price: price,
            quantity: 1,
          }
        ],
        payer: {
          name: "Jesus",
          surname: "Solano",
          email: user.email,
          identification: {
            type: "DNI",
            number: user.dni
          },
        },
        back_urls: {
          success: "https://2wanted.com/home",
          failure: "https://2wanted.com/home",
          pending: "https://2wanted.com/home"
      },
      auto_return: "approved",
      taxes: [
        {
            type: "IVA",
            value: 0
        }
      ]
    };
      
      mercadopago.preferences.create(preference)
      .then(function(response){

        res.json(response.body.init_point)
  
      }).catch(function(error){
        console.log(error);
      });
})

/* ------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------- */

router.post('/api/notification-payment', async(req, res, next) => {

  try{

    const { id } = req.query
  
    await axios.get(
      `https://api.mercadopago.com/v1/payments/${id}?access_token=${process.env.MERCADOPAGO_ACCESS_TOKEN}`
    ).then( async res => {

      const data = res.data

      if(data.status_detail === 'accredited') {

        const user = await userModel.findOne({email: data.payer.email}, { wallet: 1 })
        user.wallet = user.wallet + data.transaction_amount
        
        const newBalance = await new balanceUserModel({ 
          user: user.userName,
          type: 'deposit',
          wallet: user.wallet,
          depositAmount: data.transaction_amount
        })
        
        await user.save()
        await newBalance.save()

      }

    })
    
    res.status(200).send('OK')
      
  }catch(error){
    res.status(200).send(error)
  }

  })


/* ------------------------------------------------------------------------------------------------------- */

module.exports = router