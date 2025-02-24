const product = require('../models/productModel')

const loadProducts = async (req,res)=>{
    try {
        res.render('admin/addProduct')
    } catch (error) {
        console.error("Error",error)
    }
}

module.exports = {
    loadProducts
}