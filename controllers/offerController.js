const Offer = require('../models/offerschema')
const jwtHelper = require('../utils/jwtHelper');
const {validationResult} = require('express-validator')
const Product = require('../models/productModel')
const Category=require('../models/categoryModel');
const productModel = require('../models/productModel');

const loadOffer = async(req,res)=>{
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
              filter.name = {$regex :new RegExp(querySearch,"i")}
            }

            const totalOffers = await Offer.countDocuments()
            const totalPages = Math.ceil(totalOffers / limit)
            
            const offers = await Offer.find(filter)
            .populate('category')
            .populate('product')
            .skip(skip)
            .limit(limit)
            .sort({createdAt:-1})

            const products = await Product.find()
            const categories = await Category.find()

        res.render('admin/offer',{
            search:querySearch,
            offers:offers,
            currentPage:page,
            totalPages,
            products:products,
            categories:categories
        })
    } catch (error) {
        console.error('Error loading in offer',error);
        res.status(500).send("Internal server error");
    }
}

const getApplicableOfferDiscount = async(productId)=>{

    const product = await Product.findById(productId).populate('category')
    if(!product) return 0

    const productOffer = await Offer.findOne({
        offerType:'product',
        product:productId,
        isActive:true,
        endDate: { $gte: new Date() }
    })

    const categoryOffer = await Offer.findOne({
        offerType:'category',
        category:product.category._id,
        isActive:true,
        endDate:{$gte: new Date()}
    })

    const productDiscount = productOffer ? productOffer.discountPercentage : 0
    const categoryDiscount = categoryOffer ? categoryOffer.discountPercentage : 0

    return Math.max(productDiscount,categoryDiscount)

} 

const calculateSalePrice = async(productId) =>{
    const product= await Product.findById(productId).populate('category')
    if(!product){
        return null
    }

    const discountPercentage = await getApplicableOfferDiscount(productId)
    const discountAmount = Math.round((discountPercentage / 100) * product.regularPrice)
    product.salePrice = product.regularPrice - discountAmount

    await product.save()

    return product.salePrice
}



const verifyOffer = async(req,res)=>{
    try {
        const error = validationResult(req);
            if (!error.isEmpty()) {
                return res.status(400).json({
                success: false,
                error: error.array() 
                });
            }

        const { name,offerType,productId,categoryId,discountPercentage,endDate} = req.body;
        
       const duplicateOffer = await Offer.findOne({name:name})
       if(duplicateOffer){
        return res.status(400).json({
            success:false,
            error:[{path:'name',msg:'Offer is already created'}]
        })
       } 

       if(discountPercentage > 85){
        return res.status(400).json({
            success:false,
            error:[{path:'discountPercentage',msg:"Offer cannot be set to more than 85%."}]
        })
       }

       if(discountPercentage <= 0){
        return res.status(400).json({
            success:false,
            error:[{path:'discountPercentage',msg:'Offer cannot be set less than 1%'}]
        })
       }
        
        let offerData ={
            name,
            offerType,
            discountPercentage,
            endDate,
            isActive:true
        }

        if(offerType === 'product'){
            if (!productId) {
                return res.status(400).json({ success: false, message: 'Product Id is required for a product offer' });
            }
            offerData.product = productId
        }
        else if(offerType === 'category'){
            if (!categoryId) {
                return res.status(400).json({ success: false, message: 'Category Id is required for a category offer' });
              }
            offerData.category = categoryId
        }
        else{
            return res.status(400).json({ success: false, message: 'Invalid offer type' }); 
        }



        const offer = new Offer(offerData);
        await offer.save();
        
        if(offerType === 'product'){
            await calculateSalePrice(productId)
        }
        else if(offerType === 'category'){
            const products = await Product.find({category:categoryId})

            for(let product of products){
                await calculateSalePrice(product._id)
            }
        }

        return res.status(200).json({
            success: true,
            message: "Offer created and applied successfully",
            offer
          });

    } catch (error) {

        console.error("Error verifying offer:", error);
        return res.status(500).json({ success: false, message: "Server error" }); 
    }
}

const updateStatus = async(req,res)=>{
    try {
        const offerId = req.params.id
        const {action} = req.body

        const update = (action === 'disable') ? {isActive:false} : {isActive:true}
        const updatedData = await Offer.findByIdAndUpdate(offerId,update,{new:true})
        if (!updatedData) {
            return res.status(404).json({ success: false, message: "Offer not found" });
          }

        if(!update.isActive){
            if(updatedData.offerType === 'product'){
                await calculateSalePrice(updatedData.product)
            }
            else if(updatedData.offerType === 'category'){
                const products = await Product.find({category:updatedData.category})
                for(let product of products){
                    await calculateSalePrice(product._id)
                }
            }
        }

        return res.status(200).json({ success: true, message: "Offer status updated successfully" });

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: "Failed to update offer status" });
    }
}

const loadEdit = async(req,res)=>{

    try {
        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.redirect('/admin/login');
        }
    
        const offer = await Offer.findById(req.params.id)
        .populate('product')
        .populate('category')

        if(!offer){
            return res.status(400).json({
                success:false,
                message:'Offer not found'
            })
        }

        const categories = await Category.find()
        const products = await Product.find()
    
        res.render('admin/editOffer',{offer,categories,products})

    } catch (error) {
        console.error('Error loading offer',Error);
        return res.status(500).json({
            success:false,
            message:'Server error'
        })
        
    }
  


}

const verifyEdit = async(req,res)=>{
    try {
    const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
            success: false,
            error: error.array() 
                });
            }

    const {name,discountPercentage,endDate,productId,categoryId} = req.body
    const id= req.params.id
    const offer = await Offer.findById(id)
    if(!offer){
        return res.status(400).json({
            success:false,
            message:'Offer not found'
        })
    }

    if(discountPercentage > 85){
        return res.status(400).json({
            success:false,
            error:[{path:'discountPercentage',msg:'Offer cannot be set to more than 85%.'}]
        })
    }

    if(discountPercentage <= 0){
        return res.status(400).json({
            success:false,
            error:[{path:'discountPercentage',msg:"Offer cannot be set to less than 1%"}]
        })
    }

    const duplicate = await Offer.findOne({
        name:name,
        _id:{$ne:id}
    })

    if(duplicate){
        return res.status(400).json({
            success:false,
            error:[{path:'name',msg:'Offer already created'}]
        })
    }

    const updatedData = {
        name:name,
        discountPercentage:discountPercentage,
        endDate:endDate
        
    }
            
    if (offer.offerType === 'category') {
        updatedData.category = categoryId;
    } else if (offer.offerType === 'product') {
        updatedData.product = Array.isArray(productId) ? productId : [productId];
    }    

    const updateOffer = await Offer.findByIdAndUpdate(
        id,
        updatedData,
        {new:true}
    )

    if(offer.offerType === 'product'){
        const productsToUpdate = Array.isArray(updateOffer.product) ? updateOffer.product : [updateOffer.product]
        for(let prodId of productsToUpdate){
            await calculateSalePrice(prodId)
        }
    }

    if(offer.offerType === 'category'){
        const products = await Product.find({category:updateOffer.category})
        for(let product of products){
            await calculateSalePrice(product._id)
        }
    }

        res.json({ success: true, message: 'Offer updated successfully',offer:updateOffer });
            
    } catch (error) {
        console.error('Error in editing offer',error);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    loadOffer,
    verifyOffer,
    updateStatus,
    getApplicableOfferDiscount,
    loadEdit,
    verifyEdit
}