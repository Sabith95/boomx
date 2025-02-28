const express = require('express')
const admin_route = express.Router()

// const session = require('express-session')
// const path = require('path')

// const auth = require('../middlewares/adminAuth')



const upload = require('../config/multerConfig')
const adminController  = require('../controllers/adminController')
const categoryController = require('../controllers/catagoryController')
const brandController = require('../controllers/brandController')
const productController =require('../controllers/productController')
const adminUserController=require('../controllers/adminUserController')




admin_route.get('/login',adminController.loadLogin)
admin_route.post('/login',adminController.verifyLogin)
admin_route.get('/dashboard',adminController.loadDashboard)

// category section

admin_route.get('/category',categoryController.loadCategories)
admin_route.post('/category',upload.single('image'),categoryController.verifyCategory)



 // list/ulisting category

 admin_route.get('/category/unlist/:id',categoryController.unlistCategory)
 admin_route.get('/category/list/:id',categoryController.listCategory)

 //edit category
 admin_route.put('/category/:id',upload.single('image'),categoryController.editCategory)


 // brand management

 admin_route.get('/brands',brandController.loadBrands)
 admin_route.post('/brands',upload.single('image'),brandController.verifyBrand)

 // listong and unlisting brand
 admin_route.get('/brands/unlist/:id',brandController.unlistBrand)
 admin_route.get('/brands/list/:id',brandController.listBrand)

 // editing brand

 admin_route.get('/brands/edit/:id',brandController.loadEdit)
 admin_route.put('/brands/edit/:id',upload.single('image'),brandController.editBrand)


 // product section

 admin_route.get('/addProducts',productController.loadAddProducts)
 admin_route.post('/addProducts',upload.array('image',3),productController.verifyAddProduct)
 admin_route.get('/products',productController.loadProducts)
 admin_route.patch('/products/:id/changeStatus',productController.updateStatus)
 admin_route.get('/products/edit/:id',productController.loadEdit)
 admin_route.put('/products/edit/:id',upload.array('image',3),productController.editProduct)

//user section

admin_route.get('/users',adminUserController.loadUser)
admin_route.patch('/users/:id/changeStatus',adminUserController.updateStatus)


 
module.exports = admin_route
