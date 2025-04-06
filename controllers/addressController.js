const { validationResult } = require("express-validator")
const Address = require('../models/addressModel')
const User = require('../models/userModel')



const loadAddAddress = async(req,res)=>{
    try {

        const querySearch = req.query.search ?req.query.search.trim():""
        const filter = {}
        if(querySearch){
          filter.name = {$regex :new RegExp(querySearch,"i")}
        }

        res.render('user/addAddress',{search:querySearch})
    } catch (error) {
        console.error(error);
        
    }
}

const verifyAddress=async(req,res)=>{
    try {
        

        const error = validationResult(req);
                    if (!error.isEmpty()) {
                        return res.status(400).json({
                        success: false,
                        error: error.array() 
                        });
                    }
                    
        const newAddress = await Address.create(req.body)
        console.log(req.body)
     
        
        await User.findByIdAndUpdate(req.params.id,{$push : {addresses:newAddress._id }})

        res.status(200).json({
            success:true,
            message:"Address added successfully"
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({success:false,error:"Something went wrong"})        
    }
}

const changeDefault=async(req,res)=>{
    try {
        const addressId = req.params.id
    
        
        await Address.updateMany(
            { _id: { $in: req.user.addresses }, isDefault: true },
            { $set: { isDefault: false } }
          );

        const updateAddress = await Address.findByIdAndUpdate(
            addressId,
            {isDefault:true},
            {new:true}
        )

        if (!updateAddress) {
            return res.status(404).send('Address not found');
          }

          return res.status(200).json({
            success: true,
            message: 'Address set as default successfully'
            
          });
          
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).send('Internal Server Error');
    }
}

const loadEditAddress = async(req,res)=>{
    try {

        const id = req.params.id
        const address = await Address.findById(id)


        const querySearch= req.query.search ? req.query.search:''
        const filter={}
        if(querySearch){
            filter.name= {$regex :new RegExp(querySearch,"i")}

        }

        res.render('user/editAddress',{address,search:querySearch})
    } catch (error) {
        console.error(error)
    }
}

const editAddress =async(req,res)=>{
    try {

        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
            success: false,
            error: error.array() 
            });
        }

        const id = req.params.id
        const {addressType,name,phone,streetAddress,city,state,pinCode,country} = req.body
        

        if(!name || !phone){
            return res.status(400).json({success:false,message:'Missing required fields'})
        }
        
        const updateData={
            addressType:addressType.trim(),
            name:name.trim(),
            phone:phone.trim(),
            streetAddress:streetAddress.trim(),
            city:city.trim(),
            state:state.trim(),
            pinCode:pinCode.trim(),
            country:country.trim()
            
        }

        const updateAddress=await Address.findByIdAndUpdate(
            id,
            updateData,
            {new:true}
        )
        if(!updateAddress){
            return res.status(400).json({success:false,message:'Address not found'})
        }

        return res.status(200).json({
            success:true,
            message:'Address updated successfully',
            address:updateData
        })
        
    } catch (error) {
        console.log('Error updating address:',error);
        return res.status(500).json({success:false,message:'Internal server error'})
        
    }
}

const deleteAddress=async(req,res)=>{
    try {
        const id = req.params.id
        console.log(id);
        

        const deleteAddress= await Address.findByIdAndDelete(id)
        
        if(!deleteAddress){
            return res.status(400).json({success:false,message:'Address not found'})
        }

        await User.findByIdAndUpdate(req.user._id,{
            $pull:{addresses:id}
        })

        return res.status(200).json({
            success:true,
            message:"Address deleted successfully"
        })

    } catch (error) {
        
        console.error("Error deleting address:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error"
        });
    }
}

module.exports={
    loadAddAddress,
    verifyAddress,
    changeDefault,
    loadEditAddress,
    editAddress,
    deleteAddress
}