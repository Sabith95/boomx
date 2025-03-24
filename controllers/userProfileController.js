const User = require('../models/userModel')
const {validationResult}= require('express-validator')
const { search, param } = require('../routes/adminRoutes')
const bcrypt = require('bcrypt');
const otpHelper = require('../utils/otpHelper');
const jwt = require('jsonwebtoken');
const jwtHelper = require('../utils/jwtHelper');
const Order = require('../models/orderModel')
const Wallet = require('../models/walletModel')


const loadAccount =async(req,res)=>{
    try {
        const activeTab=req.query.tab ? req.query.tab.trim() :'profile'
        const id= req.params.id
        const user=await User.findById(id)
        .populate('addresses')
        
        const defaultAddress = user.addresses.find(address => address.isDefault)


         const querySearch = req.query.search ? req.query.search.trim():""
                const filter={}
                if(querySearch){
                    filter.name ={$regex : new RegExp(querySearch,"i")}
                }

        const orders = await Order.find({user:id}).sort({createdAt: -1}).populate('items.product')
        
        let wallet = await Wallet.findOne({user:id})
        if(!wallet){
            wallet = await new Wallet({ user:id, balance: 0 }).save();
        }


        

        res.render('user/userProfile',{user,activeTab,search:querySearch,defaultAddress,orders,wallet})
    } catch (error) {
        console.error(error);
        
    }
    
}

const loadEditProfile = async(req,res)=>{
    try {
        const id = req.params.id
        const user= await User.findById(id)

        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
        }
        
        res.render('user/editProfile',{user,search:querySearch})
    } catch (error) {
        console.error(error);
        
        
    }
}

const editProfile = async(req,res)=>{
    try {

        const error=validationResult(req)
                if(!error.isEmpty()){
                    const errorMessages=error.array().map(error => error.msg)
                    return res.status(400).json({
                        success:false,
                        error:errorMessages
                    })
                }
        
        const id = req.params.id
        const user = await User.findById(id)
        if(!user){
            return res.status(400).json({success:false,message:'User not found'})
        }
        const {name,mobile} = req.body

       if(!name || !mobile){
        return res.status(400).json({success:false,message:"Misssing required fields"})
       }

      
       const updateData={
        name:name.trim(),
        mobile:mobile.trim()
       }
       if(req.file){
        updateData.image='/uploads/' + req.file.filename
       }

       const updatedUser= await User.findByIdAndUpdate(
        id,
        updateData,
        {new:true}
       )
       if(!updatedUser){
        return res.status(404).json({success:false,message:'User not found'})
       }

       return res.status(200).json({
        success:true,
        message:'User updated successfully',
        user:updatedUser
       })
    } catch (error) {
        console.error('Error updating user:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const loadEditEmail=async(req,res)=>{
    try {
        const id = req.params.id
        const user=await User.findById(id)

        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
        }

        res.render('user/editEmail',{user,search:querySearch})
    } catch (error) {
        console.error(error);
        
    }
}

const sendOtp=async(req,res)=>{
    try {


        const error=validationResult(req)
        if(!error.isEmpty()){
            const errorMessages=error.array().map(error => error.msg)
            return res.status(400).json({
                success:false,
                error:errorMessages
            })
        }

        const id = req.params.id
        const user=await User.findById(id)

        const {email,password} = req.body
        console.log(req.body);
        

        if(!email || !password){
            return res.status(400).json({success:false,message:"Email and password are required"})
        }

        const existingUser= await User.findOne({email})
        if(existingUser){
            return res.status(400).json({success:false,message:"Email already registered"})
        }

        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(400).json({success:false,message:"Invalid password"})
        }

        const otp = otpHelper.generateOtp()
        console.log(otp)

        const token= otpHelper.generateOtpToken({email},otp)
        await otpHelper.sendOtpEmail(email,otp)

        return res.status(200).json({success:true,message:"Otp sent successfully",token})

    } catch (error) {
        console.error(error);
        res.status(500).json({error:"Failed to send otp"})
    }
}

const loadOtp=async(req,res)=>{
    try {

        const id = req.params.id
        const user= await User.findById(id)

        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
           
        }

        res.render('user/emailOtp',{user,search:querySearch})

    } catch (error) {
        console.error(error);
        
    }
}

const verifyOtp=async(req,res)=>{
    try {
        const id = req.params.id
        const user = await User.findById(id)

        const {otp,token}=req.body
        console.log('entered otp:',otp)

        const decoded= otpHelper.verifyOtpToken(token,otp)
        if(!decoded){
            return res.status(400).json({error:"Invalid or expired otp"})
        }

        const updateData={
            email:decoded.email.trim()
        }

        const updateEmail=await User.findByIdAndUpdate(
            id,
            updateData,
            {new:true}
        )
        
        if(!updateEmail){
            return res.status(400).json({success:false,message:"Email not found"})
        }

        return res.status(200).json({
            success:true,
            message:"Email updated successfully",
            email:updateData
        })
    } catch (error) {
     console.error("Error updating email:",error)
     return res.status(400).json({success:false,message:"Internal server error"})   
    }
}


const changePassword=async(req,res)=>{
    try {

        const id = req.params.id
        const user = await User.findById(id)
        

        const {currentPassword,newPassword,confirmPassword}= req.body
        

        if(!currentPassword){
            return res.status(400).json({ 
               errors:[{param:'currentPassword',msg:"Password is required"}] 
            })
        }

        const isMatch = await bcrypt.compare(currentPassword,user.password)
        if(!isMatch){
            return res.status(400).json({
                errors:[{param:'currentPassword',msg:"Invalid password"}]
            })
        }

        const passwordRegex=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

        if(!passwordRegex.test(newPassword)){
            return res.status(400).json({
              errors:[{param:"newPassword",msg:"New password must be at least 6 characters long, contain one lowercase letter, one uppercase letter, one digit, and one special character"}]
            })
        }


        if(newPassword !== confirmPassword){
            return res.status(400).json({
                errors:[{param:'confirmPassword',msg:'Password mismatch'}]
            })
        }

        const hashPassword=await bcrypt.hash(newPassword,10)

        const updateData={
            password:hashPassword
        }

        const updatedPassword=await User.findByIdAndUpdate(
            id,
            updateData,
            {new:true}
        )

        return res.status(200).json({
            success:true,
            message:"Password updated successfully"
        })


    } catch (error) {
        console.error(error);
        return res.status(500).json({success:false,message:'Internal server error'})
        
    }
}



module.exports={
    loadAccount,
    loadEditProfile,
    editProfile,
    loadEditEmail,
    sendOtp,
    loadOtp,
    verifyOtp,
    changePassword
}