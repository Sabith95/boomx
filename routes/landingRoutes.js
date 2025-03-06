const express = require('express')
const landing_route = express.Router()
const landingController = require('../controllers/landingController')

landing_route.get('/',landingController.loadDashboard)

module.exports=landing_route