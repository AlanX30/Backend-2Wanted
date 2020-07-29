const express = require('express')
const mercadopago = require('mercadopago')
const router = express.Router()
const userModel = require('../models/Users')
const verifyToken = require('./verifyToken')
const axios = require('axios')

mercadopago.configure({
    access_token: 'APP_USR-3607827864573449-052713-45658c68540d38f5cd26871951e4480b-209450396'
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
          success: "https://2wanted.com",
          failure: "http://2wanted.com/failure",
          pending: "http://2wanted.com/pending"
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

    const {topic, id} = req.query
  
    const ipn = await axios(
      `https://api.mercadopago.com/v1/payments/:${id}?access_token=APP_USR-3607827864573449-052713-45658c68540d38f5cd26871951e4480b-209450396`
    )

    console.log(ipn)

    /* if(ipn.status === approved && ipn.status_detail === accredited) {
      
    } */
  
    res.status(200).send('OK')
      
  }catch(error){
    res.status(200).json(error)
  }

  })


/* ------------------------------------------------------------------------------------------------------- */

module.exports = router