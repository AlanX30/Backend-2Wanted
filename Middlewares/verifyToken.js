const jwt = require('jsonwebtoken')

const verifyToken = async(req, res, next) => {

    const token = req.headers['authorization']
    
    if (!token) {
        return res.json({auth: 'false', error: 'No token provided'})
    }

    try{
        
        const decodedToken = await jwt.verify(token, process.env.SECRET_JSONWEBTOKEN)
        req.userToken = decodedToken.id

    }catch(error){

        return res.json({error: 'Token error'})

    } 

    next()

}

module.exports = verifyToken