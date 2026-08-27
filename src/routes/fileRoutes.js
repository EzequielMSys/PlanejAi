const express = require('express')
const controller = require('../controllers/fileController')
const { authMiddleware } = require('../middlewares/authMiddleware')

const router = express.Router()
router.get('/sign', authMiddleware, controller.sign)
router.get('/open/:token', controller.open)
module.exports = router
