const express = require('express');
const user_route = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const userController = require('../controllers/userController');
const userProductController=require('../controllers/userProductController')
const userAuth = require('../middlewares/userAuth')
const upload = require('../config/multerConfig')
const userProfileController=require('../controllers/userProfileController')
const addressController=require('../controllers/addressController')
const{  validateAddress }= require('../middlewares/validateAddress')
const {validateInfo} = require('../middlewares/validateInfo')
const {validateEmail}= require('../middlewares/validateEmail')
const cartController=require('../controllers/cartController')
const wishlistController = require('../controllers/wishlistController')
const checkoutController=require('../controllers/checkoutController')
const orderController =require('../controllers/orderController')




// Google login route
user_route.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

user_route.get('/auth/google/callback', passport.authenticate('google', { 
    failureRedirect: '/user/login',
    session: false
}), (req, res) => {
    const token = req.user.token;
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.redirect('/user/home');
});

// Google login callback
user_route.get('/signup',userAuth.redirectIfAuthenticated, userController.loadSignUp);


user_route.post('/send-otp',upload.single('image'), userController.sendOtp);
user_route.post('/verify-otp', userController.verifyOtp);
user_route.get('/login',userAuth.redirectIfAuthenticated, userController.loadLogin);
user_route.post('/login', userController.userVerifyLogin);

// Forgot Password Routes
user_route.post('/forgot-password/send-otp', userController.forgotPasswordSendOtp);
user_route.post('/forgot-password/verify-otp', userController.forgotPasswordVerifyOtp);
user_route.post('/forgot-password/reset-password', userController.resetPassword);
user_route.get('/forgot-password/otp', userController.loadOtpPage);
user_route.get('/forgot-password/reset-password', userController.loadResetPasswordPage);

user_route.get('/home',userAuth.checkUserStatus, userController.loadDashboard);

//shope

user_route.get('/shope',userAuth.checkUserStatus,userProductController.loadShope)
user_route.get('/view-product/:id',userAuth.checkUserStatus,userProductController.loadViewProduct)
user_route.get('/categories/:id',userAuth.checkUserStatus,userProductController.loadCategories)
user_route.get('/logout',userAuth.checkUserStatus,userController.logoutUser)

//profile
user_route.get('/account/:id',userAuth.checkUserStatus,userProfileController.loadAccount)
user_route.get('/account/edit/:id',userAuth.checkUserStatus,userProfileController.loadEditProfile)
user_route.put('/account/edit/:id',userAuth.checkUserStatus,upload.single('image'),validateInfo,userProfileController.editProfile)

//edit email
user_route.get('/account/edit-email/:id',userAuth.checkUserStatus,userProfileController.loadEditEmail)
user_route.patch('/account/edit-email/send-otp/:id',userAuth.checkUserStatus,validateEmail,userProfileController.sendOtp)
user_route.get('/account/edit-email/verify-otp/:id',userAuth.checkUserStatus,userProfileController.loadOtp)
user_route.patch('/account/edit-email/verify-otp/:id',userAuth.checkUserStatus,userProfileController.verifyOtp)

// change password

user_route.patch('/account/change-password/:id',userAuth.checkUserStatus,userProfileController.changePassword)

//address

user_route.get('/address/new/:id',userAuth.checkUserStatus,addressController.loadAddAddress)
user_route.post('/address/new/:id',userAuth.checkUserStatus,validateAddress,addressController.verifyAddress)
user_route.patch('/address/:id/set-default',userAuth.checkUserStatus,addressController.changeDefault)
user_route.get('/address/:id/edit',userAuth.checkUserStatus,addressController.loadEditAddress)
user_route.put('/address/:id/edit',userAuth.checkUserStatus,upload.none(),validateAddress,addressController.editAddress)
user_route.post('/address/:id/delete',userAuth.checkUserStatus,addressController.deleteAddress)


//cart management

user_route.get('/cart',userAuth.checkUserStatus,cartController.loadCart)
user_route.post('/cart/add',userAuth.checkUserStatus,cartController.addToCart)
user_route.post('/cart/remove/:id',userAuth.checkUserStatus,cartController.removeCart)
user_route.post('/cart/update-quantity',userAuth.checkUserStatus,cartController.updateQuantity)


//wishlist management

user_route.get('/wishlist',userAuth.checkUserStatus,wishlistController.loadWishlist)
user_route.post('/wishlist/add',userAuth.checkUserStatus,wishlistController.addToWishlist)
user_route.post('/wishlist/delete/:id',userAuth.checkUserStatus,wishlistController.deleteWishlist)

//checkout

user_route.get('/checkout',userAuth.checkUserStatus,checkoutController.loadCheckOut)
user_route.post('/order',userAuth.checkUserStatus,checkoutController.placeOrder)
user_route.get('/order/confirmation/:id',userAuth.checkUserStatus,checkoutController.loadConfirmation)
user_route.post('/payment/verify',userAuth.checkUserStatus,checkoutController.verifyPayment)
user_route.post('/order/retry/:id',userAuth.checkUserStatus,checkoutController.retryOrder)
user_route.get('/order/failure/:id',userAuth.checkUserStatus,checkoutController.loadFailure)

//coupon management

user_route.post('/checkout/apply-coupon',userAuth.checkUserStatus,checkoutController.applyCoupon)
user_route.post('/checkout/remove-coupon',userAuth.checkUserStatus,checkoutController.removeCoupon)

//order

user_route.get('/order/detail/:id',userAuth.checkUserStatus,orderController.loadOrderDetail)
user_route.get('/order/invoice/:id',userAuth.checkUserStatus,orderController.generateInvoice)
user_route.put('/order/cancel/:id',userAuth.checkUserStatus,orderController.cancelOrder)
user_route.put('/order/return/:id',userAuth.checkUserStatus,orderController.returnRequest)

//referral

user_route.post('/apply-referral',upload.none(),userAuth.checkUserStatus,userController.applyReferral)


module.exports = user_route
