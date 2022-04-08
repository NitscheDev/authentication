const bcryptjs = require('bcryptjs')
const { isEmail, isEmpty } = require('valix')
const { getUser, createUser } = require('../helpers/auth.helper')
const { createAccessToken, createRefreshToken, retriveRefreshToken } = require('../helpers/jwt.helper')
const jwt = require('jsonwebtoken')
const Refresh = require('../models/refresh')
const { generateID } = require('../helpers/defaults')

exports.login = async (req,res) => {
    const { email, password } = req.body
    //validate request data
    if (isEmpty(password) || isEmpty(email)) return res.status(400).json('Email and password is required')
    if (!isEmail(email)) return res.status(400).json('Invalid Email')
    //retrive user
    try {
        const user = await getUser({ email })
        if (user === null) return res.status(400).json('Email or password incorrect')
        //compare hashed password to given password(plain text)
        bcryptjs.compare(password, user.password, async (error,result) => {
            if (error) return res.status(500).json(error)
            if (result === false) return res.status(400).json('Email or password incorrect')
            //generate tokens
            const access = createAccessToken({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin })
            const refresh = await createRefreshToken({ _id: user._id }).catch(error => { return res.status(500).json(error)})
            //set response cookies
            res.cookie('access_token', access, { httpOnly: true })
            res.cookie('refresh_token', refresh, { httpOnly: true, path: '/api/auth/refresh' })
            //send success response
            return res.json({
                user: { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }
            })
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

exports.signup = async (req,res) => {
    const { name,email,password } = req.body
    //validate data
    if (isEmpty(name) || isEmpty(email) || isEmpty(password)) {
        return res.status(400).json('All fields required')
    }
    if (!isEmail(email)) return res.status(400).json('Invalid Email')
    //check if user already exist with this email
    const user = await getUser({ email }).catch(err => res.status(500).json(err))
    if (user !== null) return res.status(400).json('Email already taken')
    //hash password
    const hash = bcryptjs.hashSync(password, 10)
    //save new user to database
    try {
        const doc = await createUser({
            _id: generateID(),
            name,
            email,
            password: hash,
            isAdmin: false
        })
        //generate tokens
        const access = createAccessToken({ _id: doc._id, name, email, isAdmin: doc.isAdmin })
        const refresh = await createRefreshToken({ _id: doc._id }).catch(err => res.status(500).json(err))
        //set response cookies
        res.cookie('access_token', access, { httpOnly: true })
        res.cookie('refresh_token', refresh, { httpOnly: true, path: '/api/auth/refresh' })
        //send response
        return res.json({
            user: { _id: doc._id, name, email, isAdmin: doc.isAdmin }
        })
    } catch (error) {
        return res.status(500).json(error)
    }
}

exports.refresh = async (req,res) => {
    const token = req.cookies.refresh_token
    if (!token) return res.status(401).json('You are not authenticated')
    //validate refresh token
    jwt.verify(token, process.env.JWT2_SECRET, async (error,decoded) => {
        if (error) return res.status(403).json('Invalid token')
        const userId = decoded._id
        //retrive refresh token from database
        try {
            const doc = await retriveRefreshToken(token)
            if (doc === null) return res.status(401).json('You are not authenticated')
            //compare userId's to make sure we have correct token from database
            if (userId !== doc.userId) return res.status(403).json('Invalid token')
            //compare token from database and cookie to make sure both are valid
            if (token !== doc.token) return res.status(403).json('Invalid token')
            //validate expired access token
            const access_token = req.cookies.access_token
            if (!access_token) return res.status(401).json('You are not authenticated')
            //decode access token to verify that refresh and access token carries the same user id
            //to prevent users from stealing other access tokens and refreshing them with their own refresh token
            const decoded = jwt.decode(access_token)
            const accessUserId = decoded._id
            //if id in access token and refresh token match run code below
            if (accessUserId === userId) {
                jwt.verify(access_token, process.env.JWT1_SECRET, async (error,decoded) => {
                    if (error) {
                        //check for TokenExpiredError error name if accrue token is valid but expired
                        if (error.name === 'TokenExpiredError') {
                            const decoded = jwt.decode(access_token)
                            //generate new tokens
                            const newAccessToken = createAccessToken({
                                _id: decoded._id,
                                name: decoded.name,
                                email: decoded.email,
                                isAdmin: decoded.isAdmin
                            })
                            const newRefreshToken = await createRefreshToken({ _id: decoded._id }).catch(error => { return res.status(500).json(error)})
                            //send response
                            res.cookie('access_token', newAccessToken, { httpOnly: true })
                            res.cookie('refresh_token', newRefreshToken, { httpOnly: true, path: '/api/auth/refresh'  })
                            return res.json('Tokens Refreshed')
                        } else {
                            return res.status(403).json('Invalid token')
                        }
                    } else if (decoded) {
                        //This will only run if the user try refreshing a valid access token
                        return res.json('Tokens valid')
                    }
                })
            } else {
                //this will only run if someone tryes to get a new access token with a refresh token holding another user id
                return res.status(403).json('Invalid token')
            }
        } catch (error) {
            res.status(500).json(error)
        }
    })
}

exports.logout = (req,res) => {
    const access_token = req.cookies.access_token
    if (!access_token) return res.status(401).json('You are not authenticated')
    const decoded = jwt.decode(access_token)
    //delete refresh token from database
    Refresh.deleteOne({ userId: decoded._id }, (error,results) => {
        if (error) return res.status(500).json(error)
        //clear cookies
        res.cookie('access_token', '', { maxAge: 1 })
        res.cookie('refresh_token', '', { maxAge: 1, path: '/api/auth/refresh'  })
        //send response
        res.json('Logged out successfully')
    })
}

exports.getUserInfo = (req,res) => {
    return res.json(req.user)
}