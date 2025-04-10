const express = require('express')
const landing_route = express.Router()
const landingController = require('../controllers/landingController')
const userAuth = require('../middlewares/userAuth')

landing_route.get('/',userAuth.redirectIfAuthenticated,landingController.loadDashboard)

module.exports=landing_route