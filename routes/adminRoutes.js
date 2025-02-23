const express = require('express')
const admin_route = express.Router()

// const session = require('express-session')
// const path = require('path')

// const auth = require('../middlewares/adminAuth')



const adminController  = require('../controllers/adminController')
const categoryController = require('../controllers/catagoryController')
const upload = require('../config/multerConfig')


admin_route.get('/login',adminController.loadLogin)
admin_route.post('/login',adminController.verifyLogin)
admin_route.get('/dashboard',adminController.loadDashboard)

// category section

admin_route.get('/category',categoryController.loadCategories)
admin_route.post('/category',upload.single('image'),categoryController.verifyCategory)



 // list/ulisting category

 admin_route.get('/category/unlist/:id',categoryController.unlistCategory)
 admin_route.get('/category/list/:id',categoryController.listCategory)
 admin_route.put('/category/:id',categoryController.editCategory)

module.exports = admin_route
