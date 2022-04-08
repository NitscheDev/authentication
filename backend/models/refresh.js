const mongoose = require('mongoose')

const RefreshSchema = new mongoose.Schema({
    _id: String,
    userId: String,
    token: String
})

module.exports = mongoose.model('refresh', RefreshSchema, 'refresh_tokens')