const mongoose = require('mongoose')


const connectDB = async (uri) => {
    if (!uri) throw Error('Uri is required -> connectDB()')
    //connect
    try {
        await mongoose.connect(uri)
        console.log('MongoDB Connected...')
    } catch (error) {
        console.log('MongoDB Error: ' + error)
    }
}


module.exports = { connectDB }