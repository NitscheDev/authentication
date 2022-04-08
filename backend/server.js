require('dotenv').config()
const express = require('express')
const app = express()
const { connectDB } = require('./config/mongodb')
const port = process.env.PORT || 7000
const cookieParser = require('cookie-parser')

//Middleware's
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

//Connect MongoDB
connectDB(process.env.MONGO_URI)

//Routes
app.use('/api/auth', require('./routes/auth.route'))

//Start Server
app.listen(port, () => console.log(`Server alive at http://localhost:${port}`))

//TODO: Create admin auth middleware + route that returns true or false depending on if user is authed or not