const jwtHelper = require('../utils/jwtHelper');


 const redirectIfAuthenticated = (req, res, next) => {
    const token = req.cookies.adminToken;
    if (token && jwtHelper.verifyToken(token)) {
      return res.redirect('/admin/dashboard');
    }
    next();
  };

  module.exports={
    redirectIfAuthenticated
  }
