const product = require('../models/productModel')
const brand = require('../models/brandModel')
const category =require('../models/categoryModel')
const jwtHelper = require('../utils/jwtHelper');
const {validationResult} = require('express-validator')



const loadAddProducts = async (req,res)=>{
    try {

        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.redirect('/admin/login');
        }

        

        const brands = await brand.find()
        const categories= await category.find()
        

        res.render('admin/addProduct',{brands,categories})
    } catch (error) {
        console.error("Error",error)
    }
}

const loadProducts = async(req,res)=>{
    try {

        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.redirect('/admin/login');
        }


        const page = parseInt(req.query.page) || 1
        const limit = 5
        const skip = (page - 1)* limit

        const querySearch = req.query.search ? req.query.search.trim():""
        const filter={}
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
        }
        const products = await product.find(filter).sort({createdAt:-1}).skip(skip).limit(limit)
        .populate('brand')
        .populate('category')
       

        const totalItems = await product.countDocuments()
        const totalPages = await Math.ceil(totalItems/limit)

       
        res.render('admin/product',{products,search:querySearch,currentPage:page,totalPages})
    } catch (error) {
        console.error("Error",error)
    }
}

const verifyAddProduct=async (req,res)=>{
    try {

        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.status(401).json({ success: false, message: "Unauthorized access" });
        }

        const error = validationResult(req);
            if (!error.isEmpty()) {
                return res.status(400).json({
                success: false,
                error: error.array() 
                });
            }

        const {name,description,brand,category,salePrice,regularPrice,quantity} =req.body
        
        if(Number(regularPrice)<=0 || Number(salePrice)<=0){
            return res.status(400).json({
                success:false,
                message:"Price must be greater than zero"
            })
        }

        if(Number(regularPrice) < Number(salePrice)){
            return res.status(400).json({
                success:false,
                message:"The sale price cannot be higher than the regular price."
            })
        }
        
        if(Number(quantity)<0){
            return res.status(400).json({message:"Quantity cannot be set to a negative value."})
        }
       
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

        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.status(401).json({ success: false, message: "Unauthorized access" });
        }

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

const loadEdit = async(req,res)=> {
    try {

        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.redirect('/admin/login');
        }

        const brands = await brand.find()
        const categories = await category.find()

        const productToEdit = await product.findById(req.params.id)
        if(!productToEdit){
             res.status(400).send("Product not found")
        }
        res.render('admin/editProduct',{product:productToEdit,brands,categories})
    } catch (error) {
        console.error(error.message)
        res.status(500).send("An error occured")
    }
}

const editProduct = async (req, res) => {
    try {
        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.status(401).json({ success: false, message: "Unauthorized access" });
        }

        const error = validationResult(req);
            if (!error.isEmpty()) {
                return res.status(400).json({
                success: false,
                error: error.array() 
                });
            }

        const { id } = req.params;
        
        const { name, description, brand, category, salePrice, regularPrice, quantity, existingImages } = req.body;
        

        if (!name || !description) {
            return res.status(400).json({ success: false, message: "Name and description are required" });
        }

        if(Number(regularPrice)<=0 || Number(salePrice)<=0){
            return res.status(400).json({
                success:false,
                message:"Price must be greater than zero"
            })
        }

        if(Number(regularPrice) < Number(salePrice)){
            return res.status(400).json({
                success:false,
                message:"The sale price cannot be higher than the regular price."
            })
        }
        
        if(Number(quantity)<0){
            return res.status(400).json({message:"Quantity cannot be set to a negative value."})
        }

        const duplicate = await product.findOne({
            name: name.trim(),
            _id: { $ne: id }    
        });
        
        if (duplicate) {
            return res.status(400).json({ success: false, message: "A product with that name already exists" });
        }

        // Get current product
        const currentProduct = await product.findById(id);
        if (!currentProduct) {
            return res.status(400).json({ success: false, message: "Product not found" });
        }

        const updatedData = {
            name: name.trim(),
            description: description.trim(),
            brand: brand,
            category: category,
            salePrice: salePrice.trim(),
            regularPrice: regularPrice.trim(),
            quantity: quantity.trim()
        };

        // Handle image uploads
        let updatedImages = [];
        
        if (existingImages) {
            updatedImages = Array.isArray(existingImages) ? existingImages : [existingImages];
        } 
        
        else if ((!req.files || req.files.length === 0) && !req.file) {
            updatedImages = currentProduct.image || [];
        }
        
        if (req.files) {
            if (Array.isArray(req.files)) {
                const newImages = req.files.map(file => '/uploads/' + file.filename);
                updatedImages = updatedImages.concat(newImages);
            } 
            else if (typeof req.files === 'object') {
                Object.keys(req.files).forEach(fieldname => {
                    const fieldFiles = req.files[fieldname];
                    let newImages = [];
                    if (Array.isArray(fieldFiles)) {
                        newImages = fieldFiles.map(file => '/uploads/' + file.filename);
                    } else {
                        // If it's not an array, treat it as a single file object.
                        newImages.push('/uploads/' + fieldFiles.filename);
                    }
                    updatedImages = updatedImages.concat(newImages);
                });
            }
        } 
        // Handle single file upload
        else if (req.file) {
            updatedImages.push('/uploads/' + req.file.filename);
        }
        
        updatedImages = [...new Set(updatedImages)];
       
        if (updatedImages.length > 0) {
            updatedData.image = updatedImages;
            console.log("Final image array:", updatedData.image);
        }
        
        const updatedProduct = await product.findByIdAndUpdate(
            id,
            updatedData,
            { new: true }
        );
        
        if (!updatedProduct) {
            return res.status(400).json({ success: false, message: "Product not found" });
        }

        return res.status(200).json({ success: true, message: "Product updated", product: updatedProduct });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};


module.exports = {
    loadAddProducts,
    loadProducts,
    verifyAddProduct,
    updateStatus,
    loadEdit,
    editProduct
}      