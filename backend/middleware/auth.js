const jwt = require('jsonwebtoken')

exports.verifyAuth = (req,res,next) => {
    const token = req.cookies.access_token
    if (!token) return res.status(401).json('You are not authenticated')
    //verify jwt token
    jwt.verify(token, process.env.JWT1_SECRET, (error,payload) => {
        if (error) return res.status(403).json('Invalid token')
        req.user = payload
        next()
    })
}