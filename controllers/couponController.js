const { path } = require('pdfkit');
const Coupon = require('../models/couponModel')
const jwtHelper = require('../utils/jwtHelper');
const {validationResult} = require('express-validator')

const loadCoupon = async(req,res)=>{
    try {
        const token = req.cookies.adminToken;
              if (!token || !jwtHelper.verifyToken(token)) {
                  return res.redirect('/admin/login');
              }
        
              const page =parseInt(req.query.page) || 1
              const limit = 5
              const skip = (page-1)*limit
        
        
              const querySearch = req.query.search ?req.query.search.trim():""
              const filter = {}
              if(querySearch){
                filter.code = {$regex :new RegExp(querySearch,"i")}
              }
              
                const coupons = await Coupon.find(filter).sort({createdAt:-1}).skip(skip).limit(limit)
                const totalItems = await Coupon.countDocuments()
                const totalPages = await Math.ceil(totalItems / limit)

        res.render('admin/coupon',{coupons,search:querySearch,currentPage:page,totalPages})      
    } catch (error) {
        console.error(error);
        
        
    }
}

const verifyCoupon = async(req,res)=>{
    try {

          const error = validationResult(req);
                    if (!error.isEmpty()) {
                        return res.status(400).json({
                        success: false,
                        error: error.array() 
                        });
                    }

        const {code,discountValue,minimumPurchase,expiryDate,description} = req.body
        
        const existingCoupon = await Coupon.findOne({code})
        if(existingCoupon){
            return res.status(400).json({
                success:false,
                error: [{ path: "code", msg: "Coupon already registered" }]
            })
        }

        if(discountValue > 85 || discountValue <=0){
            return res.status(400).json({
                success:false,
                error:[{path:'discountValue',msg:'The discount value must range from 1 to 85. '}]
            })
        }

        if(minimumPurchase <= 0){
            return res.status(400).json({
                success:false,
                error:[{path:'minimumPurchase',msg:'The purchase amount must be a valid number.'}]
            })
        }

        const newCoupon = new Coupon({
            code,
            discountValue,
            minimumPurchase,
            expiryDate,
            description
            
        })

        await newCoupon.save()

        return res.status(200).json({
            success:true,
            message:"Coupon created successfully"
        })
        
    } catch (error) {
        console.error('Error in creating coupon',error);
        return res.status(500).json({success:false,message:'Server error'})
        
    }
}

const updateStatus = async(req,res)=>{
    try {
        const couponId = req.params.id
        const {action} = req.body

        const update = (action === 'unlist') ? {isActive:false} : {isActive:true}
        const updatedData = await Coupon.findByIdAndUpdate(couponId,update,{new:true})
        if (!updatedData) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
          }

        return res.status(200).json({ success: true, message: "Coupon status updated successfully" });

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: "Failed to update coupon status" });
    }
}

const loadEdit=async(req,res)=>{
    try {

        const token = req.cookies.adminToken;
              if (!token || !jwtHelper.verifyToken(token)) {
                  return res.redirect('/admin/login');
              }
              
        const coupon = await Coupon.findById(req.params.id)
        if(!coupon){
            return res.status(400).json({
                success:false,
                message:'Coupon not found'
            })
        }

        res.render('admin/editCoupon',{coupon})
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred");
    }
}

const verifyEdit= async(req,res)=>{
    try {

        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
            success: false,
            error: error.array() 
            });
        }

        const {id} = req.params
        const {code,discountValue,minimumPurchase,expiryDate,description} = req.body

        const duplicate = await Coupon.findOne({
            code:code.trim(),
            _id:{$ne : id}
        })
        if(duplicate){
           return res.status(400).json({success:false,
            error:[{path:'code',msg:'Coupon already registered'}]
           })
 
        }

        if(minimumPurchase <= 0){
            return res.status(400).json({
                success:false,
                error:[{path:'minimumPurchase',msg:'The purchase amount must be a valid number.'}]
            })
        }

        const updatedData = {
            code:code.trim(),
            discountValue:discountValue.trim(),
            minimumPurchase:minimumPurchase.trim(),
            expiryDate:expiryDate,
            description:description.trim()
        }

        const updateCoupon=await Coupon.findByIdAndUpdate(
            id,
            updatedData,
            {new:true}
        )
        if(!updateCoupon){
          return  res.status(400).json({success:false,message:"Coupon not found"})
        }

        return res.status(200).json({success:true,message:"Coupon updated",coupons:updateCoupon})
        
     
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}

module.exports ={
    loadCoupon,
    verifyCoupon,
    updateStatus,
    loadEdit,
    verifyEdit
}