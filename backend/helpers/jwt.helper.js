const jwt = require('jsonwebtoken')
const Refresh = require('../models/refresh')
const { generateID } = require('../helpers/defaults')

exports.createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT1_SECRET, { expiresIn: '15s' })
}

const saveRefresh = (paylaod, token) => {
    return new Promise((resolve,reject) => {
        //check if a refresh token is saved in database with this user id
        Refresh.findOne({ userId: paylaod._id }, (error,result) => {
            if (error) reject(error)
            //delete old token if we got a result from database
            if (result !== null) {
                Refresh.deleteOne({ userId: paylaod._id }, (error,result) => {
                    if (error) reject(error)
                }) 
            }
            //save refresh token to database
            Refresh.create({
                _id: generateID(),
                userId: paylaod._id,
                token
            }, (error,doc) => {
                if (error) reject(error)
                resolve(doc)
            })
        })
    })
}

exports.createRefreshToken = (payload) => {
    return new Promise((resolve,reject) => {
        const token = jwt.sign(payload, process.env.JWT2_SECRET, { expiresIn: '1y' })
        saveRefresh(payload, token).then(doc => {
            resolve(token)
        }).catch(error => {
            reject(error)
        })
    })
}

exports.retriveRefreshToken = (token) => {
    return new Promise((resolve,reject) => {
        Refresh.findOne({ token }, (error,result) => {
            if (error) reject(error)
            resolve(result)
        })
    })
}