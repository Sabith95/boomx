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

const loadEdit = async(req,res)=> {
    try {
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

const editProduct= async (req,res)=>{
    try {
        const {id} = req.params
        console.log(id);
        
        const{name,description,brand,category,salePrice,regularPrice,quantity}= req.body
        console.log(req.body)

        if(!name || !description){
            return res.status(400).json({success:false,message:"Name and description are required"})
        }

        const duplicate = await product.findOne({
            name:name.trim(),
            _id:{$ne:id}    
        })
        if(duplicate){
            res.status(400).json({success:false,message:"A product with that name is already exist"})
        }

        const updatedData={
            name:name.trim(),
            description:description.trim(),
            brand:brand,
            category:category,
            salePrice:salePrice.trim(),
            regularPrice:regularPrice.trim(),
            quantity:quantity.trim()
        }

        if(req.file){
            updatedData.image='/uploads' + req.file.filename
        }
        const updatedProduct = await product.findByIdAndUpdate(
            id,
            updatedData,
            {new:true}
        )
        if(!updatedProduct){
            res.status(400).json({success:false,message:"Product not found"})
        }

        res.status(200).json({success:true,message:"Product updated",product:updatedProduct})

    } catch (error) {
        console.log(error.message)
        res.status(500).json({success:false,message:"Something went wrong"})
    }
}

module.exports = {
    loadAddProducts,
    loadProducts,
    verifyAddProduct,
    updateStatus,
    loadEdit,
    editProduct
}