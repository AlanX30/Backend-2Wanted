const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']
    
    if (!token) {
        return res.status(401).json({auth: 'false', error: 'No token provided'})
    }

    const decodedToken = jwt.verify(token, process.env.SECRET_JSONWEBTOKEN)

    req.userToken = decodedToken.id

    next()
}

module.exports = verifyToken