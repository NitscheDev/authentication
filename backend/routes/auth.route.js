const router = require('express').Router()
const { login,refresh, logout, signup, getUserInfo } = require('../controllers/auth.controller')
const { verifyAuth } = require('../middleware/auth')


router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)
router.post('/refresh', refresh)

router.get('/user', verifyAuth ,getUserInfo)

module.exports = router