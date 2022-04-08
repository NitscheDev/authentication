const mongoose = require('mongoose')

const generateID = () =>  {
    return mongoose.Types.ObjectId().toString()
}

module.exports = {
    generateID
}