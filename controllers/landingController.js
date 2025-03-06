const jwt = require('jsonwebtoken');
const jwtHelper = require('../utils/jwtHelper');
const category=require('../models/categoryModel')
const product = require('../models/productModel')


const loadDashboard = async(req, res) => {
try {
    const products = await product.find()
    const categories = await category.find()
    res.render('user/home',{products,categories,user:null})
} catch (error) {
    console.error(error)
}
}
module.exports={
    loadDashboard
}