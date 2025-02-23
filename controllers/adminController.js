const Admin = require('../models/adminModel')
const bcrypt = require('bcrypt')


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

        res.status(200).json({message:"Login Success"})

        }
        catch(error){
            res.status(500).json({message:"Server Error"})
        }

    }

    
    const loadDashboard= async(req,res)=>{
        res.render("admin/dashboard")
    }


    
  


module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard
}


