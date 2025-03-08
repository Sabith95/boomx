const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const otpHelper = require('../utils/otpHelper');
const jwt = require('jsonwebtoken');
const jwtHelper = require('../utils/jwtHelper');
const category=require('../models/categoryModel')
const product = require('../models/productModel');
const { search } = require('../routes/adminRoutes');

const loadSignUp = async (req, res) => {
  try {
    res.render("user/signUp");
  } catch (error) {
    console.log(error.message);
  }
};

const sendOtp = async (req, res) => {
  const { name, email, mobile, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const otp = otpHelper.generateOtp();
    console.log(otp);
    const token = otpHelper.generateOtpToken({ name, email, mobile, password }, otp);
    await otpHelper.sendOtpEmail(email, otp);
    res.json({ message: "Otp sent successfully", token });
    console.log(otp);
  } catch (error) {
    res.status(500).json({ error: "Failed to send Otp" });
  }
};

const verifyOtp = async (req, res) => {
  const { otp, token } = req.body;
  console.log("received otp ", otp);
  try {
    const decoded = otpHelper.verifyOtpToken(token, otp);
    if (!decoded) {
      return res.status(400).json({ error: "Invalid or expired Otp" });
    }
    const hashPassword = await bcrypt.hash(decoded.password, 10);
   
    
    // creating new user
    const newUser = new User({
      name: decoded.name,
      email: decoded.email,
      mobile: decoded.mobile,
      password: hashPassword,
    });
   
    
    await newUser.save();
    
    
    return res.json({ message: "Account created successfully.Redirecting to login" });
  } catch (error) {
    return res.status(400).json({ error: "Otp expired or invalid" });
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render('user/login');
  } catch (error) {
    console.log(error.message);
  }
};

const logoutUser = async(req,res)=>{
  try {
    res.clearCookie('token')
    res.redirect('/user/login')
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server error during logout');
  }
}

const loadDashboard = async(req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/user/login')
  }
  const decoded = jwtHelper.verifyToken(token);
  if (!decoded) {
    return res.redirect('/user/login')
  }

  const querySearch = req.query.search ? req.query.search.trim():""
  const filter={}
  if(querySearch){
    filter.name ={$regex : new RegExp(querySearch,"i")}
}

  
  const categories =await category.find()
  const products= await product.find()


  res.render('user/home', { user: decoded.user,categories,products,search:querySearch });
};

const userVerifyLogin = async (req, res) => {

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User does not exist. Please sign up first." });
    }
    if(!user.isListed){
      return res.status(403).json({error:"Your account has been blocked by admin"})
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const token = jwtHelper.generateToken({ user: { _id: user._id, name: user.name, email: user.email } });

    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    res.status(200).json({ message: "Login successful!" });
  } catch (error) {
    console.error("Error during login verification:", error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// --- Forgot Password Flow using express-session ---

// 1. Send OTP for Forgot Password
const forgotPasswordSendOtp = async (req, res) => {
  // Use provided email if available; otherwise, use session email
  const email = req.body.email || (req.session.forgotPassword && req.session.forgotPassword.email);
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User with this email does not exist." });
    }
    const otp = otpHelper.generateOtp();
    req.session.forgotPassword = {
      otp,
      email,
      expires: Date.now() + 60 * 1000, // 1 minute expiry
      verified: false
    };
    await otpHelper.sendOtpEmail(email, otp);
    console.log(otp);
    return res.json({ message: "OTP sent successfully" });
   
    
  } catch (error) {
    console.error("Error in forgotPasswordSendOtp:", error);
    return res.status(500).json({ error: "Failed to send OTP." });
  }
};

// 2. Verify OTP for Forgot Password
const forgotPasswordVerifyOtp = async (req, res) => {
  const { otp } = req.body;
  try {
    if (!req.session.forgotPassword) {
      return res.status(400).json({ error: "No OTP request found. Please try again." });
    }
    const sessionData = req.session.forgotPassword;
    if (Date.now() > sessionData.expires) {
      req.session.forgotPassword = null;
      return res.status(400).json({ error: "OTP expired. Please resend OTP." });
    }
    if (sessionData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP." });
    }
    req.session.forgotPassword.verified = true;
    return res.json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error in forgotPasswordVerifyOtp:", error);
    return res.status(400).json({ error: "OTP expired or invalid." });
  }
};

// 3. Reset Password after OTP verification
const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  try {
    if (!req.session.forgotPassword || !req.session.forgotPassword.verified) {
      return res.status(400).json({ error: "OTP not verified. Please verify OTP first." });
    }
    const email = req.session.forgotPassword.email;
    const hashPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashPassword });
    req.session.forgotPassword = null;
    return res.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(400).json({ error: "Failed to reset password." });
  }
};

// Render OTP page
const loadOtpPage = (req, res) => {
  if (!req.session.forgotPassword || !req.session.forgotPassword.email) {
    return res.redirect('/user/forgot-password');
  }
  res.render('user/otp');
};

// Render Reset Password page
const loadResetPasswordPage = (req, res) => {
  if (!req.session.forgotPassword || !req.session.forgotPassword.verified) {
    return res.redirect('/user/forgot-password/otp');
  }
  res.render('user/reset-password');
};

module.exports = {
  loadSignUp,
  sendOtp,
  verifyOtp,
  loadLogin,
  loadDashboard,
  userVerifyLogin,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
  loadOtpPage,
  loadResetPasswordPage,
  logoutUser
};
