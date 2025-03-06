const express = require('express');
const user_route = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const userController = require('../controllers/userController');
const userProductController=require('../controllers/userProductController')
const userAuth = require('../middlewares/userAuth')



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
user_route.post('/send-otp', userController.sendOtp);
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

module.exports = user_route;
