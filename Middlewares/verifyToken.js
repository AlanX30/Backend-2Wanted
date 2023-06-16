const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')

const publicKey = fs.readFileSync(path.join(__dirname +'/public.key'), 'utf8')

const verifyToken = async(req, res, next) => {
    
    const token = req.signedCookies.token
    console.log(req.cookies.token, req.signedCookies.token)
    if (!token) {
        return res.json({auth: 'false', error: 'No token provided'})
    }

    const tokenSplit = token.split(" ")[1]
    
    try{
        
        const decodedToken = await jwt.verify(tokenSplit, publicKey, { algorithm: 'RS256' })
        
        req.userToken = decodedToken.id


    }catch(error){

        return res.json({error: 'Token error'})

    } 

    next()

}

module.exports = verifyToken