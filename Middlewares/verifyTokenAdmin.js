const jwt = require('jsonwebtoken')

const verifyToken = async(req, res, next) => {

    const token = req.signedCookies.tokenAdmin

    if (!token) {
        return res.json({auth: 'false', error: 'No token provided'})
    }

    try{
        
        await jwt.verify(token, process.env.TOKEN_ADMIN)


    }catch(error){

        return res.json({error: 'Token error'})

    } 

    next()

}

module.exports = verifyToken