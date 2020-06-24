const express = require('express')
const mercadopago = require('mercadopago')
const router = express.Router()
const userModel = require('../models/Users')
const axios = require('axios')
const verifyToken = require('./verifyToken')

mercadopago.configure({
    access_token: 'TEST-2905880522539926-062322-eb21e42e5d09ff86c0eae6c47d091fc2-589507581'
})

router.post('/payments', async(req, res, next) => {

    const {email, name, surname, phone, cc} = req.body
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
          name: name,
          surname: surname,
          email: email,
          phone: {
            number: phone
          },
          identification: {
            type: "DNI",
            number: cc
          },
        },
        back_urls: {
          success: "https://www.tu-sitio/success",
          failure: "http://www.tu-sitio/failure",
          pending: "http://www.tu-sitio/pending"
      },
      auto_return: "approved"
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

router.post('/notification-payment', async(req, res, next) => {
  const {topic, id} = req.query

  await axios({
    url: `https://api.mercadopago.com/v1/payments/:${id}?access_token=ACCESS_TOKEN_ENV`
  })


})

/* ------------------------------------------------------------------------------------------------------- */

module.exports = router