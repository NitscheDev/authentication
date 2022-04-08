const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    _id: String,
    name: String,
    email: String,
    password: String,
    isAdmin: Boolean
})

module.exports = mongoose.model('user', UserSchema, 'users')