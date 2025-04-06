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
const adminAuth=require('../middlewares/adminAuth')
const adminOrderController=require('../controllers/adminOrderController')
const {productValidation} = require('../middlewares/productValidation')
const {categoryValidation} = require('../middlewares/categoryValidation')
const {brandValidation} = require('../middlewares/brandValidation')
const {editBrandValidation} = require('../middlewares/editBrandValidation')
const {editCatValidation} = require('../middlewares/editCatValidation')
const adminStockController= require('../controllers/adminStockController')
const couponController = require('../controllers/couponController')
const {couponValidation} = require('../middlewares/couponValidation')
const salesReportController = require('../controllers/salesReportController')
const offerController = require('../controllers/offerController')
const {offerValidation} = require('../middlewares/offerValidation')
const {editOfferValidation} = require('../middlewares/editOfferValidation')
const adminWalletController = require('../controllers/adminWalletController')




admin_route.get('/login',adminAuth.redirectIfAuthenticated,adminController.loadLogin)
admin_route.post('/login',adminController.verifyLogin)
admin_route.get('/dashboard',adminController.loadDashboard)

// category section

admin_route.get('/category',categoryController.loadCategories)
admin_route.post('/category',upload.single('image'),categoryValidation,categoryController.verifyCategory)



 // list/ulisting category

 admin_route.get('/category/unlist/:id',categoryController.unlistCategory)
 admin_route.get('/category/list/:id',categoryController.listCategory)

 //edit category
 admin_route.put('/category/:id',upload.single('image'),editCatValidation,categoryController.editCategory)


 // brand management

 admin_route.get('/brands',brandController.loadBrands)
 admin_route.post('/brands',upload.single('image'),brandValidation,brandController.verifyBrand)

 // listing and unlisting brand
 admin_route.get('/brands/unlist/:id',brandController.unlistBrand)
 admin_route.get('/brands/list/:id',brandController.listBrand)

 // editing brand

 admin_route.get('/brands/edit/:id',brandController.loadEdit)
 admin_route.put('/brands/edit/:id',upload.single('image'),editBrandValidation,brandController.editBrand)


 // product section

 admin_route.get('/addProducts',productController.loadAddProducts)
 admin_route.post('/addProducts',upload.array('image',3),productValidation,productController.verifyAddProduct)
 admin_route.get('/products',productController.loadProducts)
 admin_route.patch('/products/:id/changeStatus',productController.updateStatus)
 admin_route.get('/products/edit/:id',productController.loadEdit)
 admin_route.put('/products/edit/:id',upload.array('image',3),productValidation,productController.editProduct)

//user section

admin_route.get('/users',adminUserController.loadUser)
admin_route.patch('/users/:id/changeStatus',adminUserController.updateStatus)

// orders

admin_route.get('/orders',adminOrderController.loadOrders)
admin_route.post('/orders/updateOrderStatus/:id',adminOrderController.updateStatus)
admin_route.get('/orders/orderDetails/:id',adminOrderController.loadOrderDetail)
admin_route.post('/order/return/:id',adminOrderController.returnStatus)

//stock management

admin_route.get('/stock',adminStockController.getStock)
admin_route.put('/stock/update',adminStockController.updateQuantity)

//coupon management

admin_route.get('/coupon',couponController.loadCoupon)
admin_route.post('/coupon',upload.none(),couponValidation,couponController.verifyCoupon)
admin_route.patch('/coupon/:id/changeStatus',couponController.updateStatus)
admin_route.get('/coupon/edit/:id',couponController.loadEdit)
admin_route.put('/coupon/edit/:id',upload.none(),couponValidation,couponController.verifyEdit)

//sales report

admin_route.get('/sales-report',salesReportController.loadSales)
admin_route.post('/sales-report/filter',salesReportController.filterSales)
admin_route.get('/sales-report/pdf',salesReportController.generatePdf)
admin_route.get('/sales-report/excel',salesReportController.generateExcel)

//offer management

admin_route.get('/offers',offerController.loadOffer)
admin_route.post('/offers',upload.none(),offerValidation,offerController.verifyOffer)
admin_route.patch('/offers/:id/changeStatus',offerController.updateStatus)
admin_route.get('/offers/edit/:id',offerController.loadEdit)
admin_route.post('/offers/edit/:id',upload.none(),editOfferValidation,offerController.verifyEdit)

//wallet

admin_route.get('/wallet',adminWalletController.loadWallet)
admin_route.get('/wallet/view/:id',adminWalletController.viewDetails)


//logout

admin_route.get('/logout',adminController.logoutAdmin)



 
module.exports = admin_route
