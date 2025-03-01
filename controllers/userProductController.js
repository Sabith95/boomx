const product = require('../models/productModel')
const brand =require('../models/brandModel')
const category=require('../models/categoryModel')

const loadShope =async(req,res)=>{
    try {

        const sortOption = req.query.sort
        let sort ={}
        
        switch (sortOption){
            case 'priceAsc':
                sort={salePrice:1}
                break
            case 'priceDesc':
                sort={salePrice:-1}    
                break
            case 'nameAsc':
                sort={name:1    }
                break
            case 'nameDesc':
                sort={name:-1}
                break
            case 'nameAsc':
                sort={createdAt:-1}    
        }

        let productsQuery= product.find().limit(8).sort(sort)
        .populate('brand')
        .populate('category')
        if (sortOption === 'nameAsc' || sortOption === 'nameDesc') {
            productsQuery = productsQuery.collation({ locale: 'en', strength: 2 });
          }
        const products = await productsQuery
        const categories = await category.find()
        const brands= await brand.find()
        res.render('user/shope',{products,categories,brands})
    } catch (error) {
        console.log(error.message)
    }
}

const loadViewProduct = async(req,res)=>{
    try {
        const id = req.params.id

        const products =await product.findById(id)
        .populate('brand')
        .populate('category')

        const relatedProducts=await product.find({
            category:products.category._id,
            _id:{$ne:id}
        })
        .populate('brand')
        .populate('category')
        



        res.render('user/viewProduct',{products,relatedProducts})
    } catch (error) {
        console.log(error.message)
    }
}



module.exports={
    loadShope,
    loadViewProduct
}