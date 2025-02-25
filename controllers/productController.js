const product = require('../models/productModel')
const brand = require('../models/brandModel')
const category =require('../models/categoryModel')

const loadAddProducts = async (req,res)=>{
    try {
        const brands = await brand.find()
        const categories= await category.find()
        

        res.render('admin/addProduct',{brands,categories})
    } catch (error) {
        console.error("Error",error)
    }
}

const loadProducts = async(req,res)=>{
    try {
        const products = await product.find({})
        .populate('brand')
        .populate('category')
        res.render('admin/product',{products})
    } catch (error) {
        console.error("Error",error)
    }
}

const verifyAddProduct=async (req,res)=>{
    try {
        const {name,description,brand,category,salePrice,regularPrice,quantity} =req.body
        console.log(req.body);
        
        console.log("this is the name",name)
        const existingProduct = await product.findOne({name})
        if(existingProduct){
            return res.status(400).json({success:false,message:"Product already registered"})
        }
        let imagePath = [];
        if (req.files && req.files.length > 0) {
            imagePath = req.files.map(file => '/uploads/' + file.filename);
        }
        
        const newBrand = await new product({name,description,image:imagePath,brand,category,salePrice,regularPrice,quantity})
        await newBrand.save()
        res.status(200).json({success:true,message:"Product added successfully"})
    } catch (error) {
        console.log(error.message)
        res.status(500).json({success:false,message:"Failed to add product"})
    }
}

const updateStatus =async(req,res)=>{

    try {
        const productId = req.params.id
        const {action}  = req.body
        
        const update = (action === 'unlist')?{isListed:false}:{isListed:true}
        const updatedData = await product.findByIdAndUpdate(productId,update,{new:true})
        if (!updatedData) {
            return res.status(404).json({ success: false, message: "Product not found" });
          }
          
          return res.status(200).json({ success: true, message: "Product status updated successfully" });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: "Failed to update product status" });
    }
    


}

module.exports = {
    loadAddProducts,
    loadProducts,
    verifyAddProduct,
    updateStatus
}