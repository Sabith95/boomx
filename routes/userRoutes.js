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
user_route.get('/signup', userController.loadSignUp);


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
user_route.put('/account/edit/:id',userAuth.checkUserStatus,upload.single('image'),userProfileController.editProfile)

//address

user_route.get('/address/new/:id',userAuth.checkUserStatus,addressController.loadAddAddress)
user_route.post('/address/new/:id',userAuth.checkUserStatus,validateAddress,addressController.verifyAddress)
user_route.patch('/address/:id/set-default',userAuth.checkUserStatus,addressController.changeDefault)
user_route.get('/address/:id/edit',userAuth.checkUserStatus,addressController.loadEditAddress)
user_route.put('/address/:id/edit',userAuth.checkUserStatus,upload.none(),validateAddress,addressController.editAddress)


module.exports = user_route;
