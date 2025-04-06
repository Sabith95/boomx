const product = require('../models/productModel');
const jwtHelper = require('../utils/jwtHelper');


const getStock = async(req,res)=>{
    try {

        const token = req.cookies.adminToken;
                if (!token || !jwtHelper.verifyToken(token)) {
                     return res.redirect('/admin/login');
                 }

        

        const page = parseInt(req.query.page) || 1
        const limit=5
        const skip =(page - 1) * limit
        
        const querySearch = req.query.search ? req.query.search.trim() : ''
        const filter = {}
        if(querySearch){
            filter.name = {$regex : new RegExp(querySearch,"i")}
        }

        const totalItems = await product.countDocuments()
        const totalPages= await Math.ceil(totalItems / limit)

        const products = await product.find(filter).sort({createdAt : -1}).skip(skip).limit(limit)
        .populate('category')

        res.render('admin/stock',{products,search:querySearch,currentPage:page,totalPages})

    } catch (error) {
        console.error('Error fetching the stock',error);
        return res.status(500).send('Server error')
        
    }
}

const updateQuantity = async(req,res)=>{
    try {
        const {productId,newQuantity} = req.body
        const productData = await product.findById(productId)
      
        if(!productData){
            return res.status(400).json({
                success:false,
                message:'Product not found'
            })
        }

        if(newQuantity < 0){
            return res.status(400).json({success:false,message:'Update quantity with minimum value 1'})
        }

        productData.quantity = newQuantity
        await productData.save()

        return res.json({
            success: true,
            message: 'Product stock updated successfully',
            product: productData
        });


    } catch (error) {
        console.error('Error in updating stock',error)
        return res.status(500).json({
            success:false,
            message:'Server Error'
        })
    }
}


module.exports ={
    getStock,
    updateQuantity
}