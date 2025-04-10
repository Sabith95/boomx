const jwt = require('jsonwebtoken');
const jwtHelper = require('../utils/jwtHelper');
const category=require('../models/categoryModel')
const product = require('../models/productModel')


const loadDashboard = async(req, res) => {
try {
    const products = await product.find()
    const categories = await category.find()

    const querySearch = req.query.search ? req.query.search : ""
    const filter ={}
    if(querySearch){
        filter.name={$regex : new RegExp(querySearch,"i")}
    }

    
    res.render('user/home',{products,categories,user:null,search:querySearch})
} catch (error) {
    console.error(error)
}
}
module.exports={
    loadDashboard
}