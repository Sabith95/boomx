const jwtHelper = require('../utils/jwtHelper');
const User = require('../models/userModel');


const checkUserStatus = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/user/login')
  
    const decoded = jwtHelper.verifyToken(token);
    if (!decoded) return res.redirect('/user/login')
  
    const user = await User.findById(decoded.user._id);
    if (!user || !user.isListed) {
      return res.status(403).json({ error: 'Access denied. Your account is blocked.' });
    }
    
    req.user = user;
    next();
  };


  const redirectIfAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (token && jwtHelper.verifyToken(token)) {
      return res.redirect('/user/home');
    }
    next();
  };


  module.exports={
    checkUserStatus,
    redirectIfAuthenticated
  }
  