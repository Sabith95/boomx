const Admin = require('../models/adminModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const jwtHelper = require('../utils/jwtHelper');
const adminAuth=require('../middlewares/adminAuth')


const loadLogin = async(req,res)=>{
    try{
        res.render('admin/login')
    }
    catch(error){
        console.log(error.message);
        
    }
}
const verifyLogin=async(req,res)=>{
    try{ 
        const{email,password} =req.body
        const admin=await Admin.findOne({email})
        if(!admin){
            return res.status(400).json({message:"Admin not found"})
        }
        const passwordMatch = await bcrypt.compare(password,admin.password)
    
        
        if(!passwordMatch){
            return res.status(401).json({message:"Invalid username or password"})
        }

        const token = jwtHelper.generateToken({
            admin:{
                _id:admin._id,
                email:admin.email,
            },
        })

        res.cookie('adminToken',token,{
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            path:'/admin' 
        })

        res.status(200).json({message:"Login Success"})

        }
        catch(error){
            res.status(500).json({message:"Server Error"})
        }

    }

    
    const loadDashboard= async(req,res)=>{

         const token = req.cookies.adminToken;
          if (!token) {
            return res.redirect('/admin/login')
          }
          const decoded = jwtHelper.verifyToken(token);
          if (!decoded) {
            return res.redirect('/admin/login')
          }

        res.render("admin/dashboard")
    }

    const logoutAdmin = async(req,res)=>{
        try {
          res.clearCookie('adminToken',{path:'/admin'})
          res.redirect('/admin/login')
        } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error during logout');
        }
      }


    
  


module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logoutAdmin
}


