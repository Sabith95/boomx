const product = require('../models/productModel')
const brand =require('../models/brandModel')
const category=require('../models/categoryModel')

const loadShope =async(req,res)=>{
    try {
        const products = await product.find().limit(8)

        .populate('brand')
        .populate('category')
        res.render('user/shope',{products,brand,category})
    } catch (error) {
        console.log(error.message)
    }
}

const loadViewProduct = async(req,res)=>{
    try {
        const id = req.params.id

        const products =await product.findById(id)
        res.render('user/viewProduct',{products})
    } catch (error) {
        console.log(error.message)
    }
}

module.exports={
    loadShope,
    loadViewProduct
}