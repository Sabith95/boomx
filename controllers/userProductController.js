const product = require('../models/productModel')
const brand =require('../models/brandModel')
const category=require('../models/categoryModel');
const { search } = require('../routes/adminRoutes');

const loadShope = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        // Sorting options
        const sortOption = req.query.sort;
        let sort = {};
        switch (sortOption) {
            case 'priceAsc':
                sort = { salePrice: 1 };
                break;
            case 'priceDesc':
                sort = { salePrice: -1 };
                break;
            case 'nameAsc':
                sort = { name: 1 };
                break;
            case 'nameDesc':
                sort = { name: -1 };
                break;
            case 'newest':
                sort = { createdAt: -1 };
                break;
            default:
                sort = {};
        }

        // Filtering options
        const querySearch = req.query.search ? req.query.search.trim() : "";
        let filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.brand) {
            filter.brand = req.query.brand;
        }
        if (req.query.minPrice || req.query.maxPrice) {
            filter.salePrice = {};
            if (req.query.minPrice) filter.salePrice.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filter.salePrice.$lte = Number(req.query.maxPrice);
        }
        if (querySearch) {
            filter.name = { $regex: new RegExp(querySearch, "i") };
        }

        // Query products with filtering, sorting, and pagination
        let productsQuery = product.find(filter)
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .populate('brand')
            .populate('category');

        if (sortOption === 'nameAsc' || sortOption === 'nameDesc') {
            productsQuery = productsQuery.collation({ locale: 'en', strength: 2 });
        }

        const products = await productsQuery;
        const categories = await category.find();
        const brands = await brand.find();

        // Count only filtered products for pagination
        const totalDocuments = await product.countDocuments(filter);
        const totalPages = Math.ceil(totalDocuments / limit);

        res.render('user/shope', { 
            products, 
            categories, 
            brands,
            search: querySearch,
            currentPage: page,
            totalPages,
            category: req.query.category || '',
            brand: req.query.brand || '',
            minPrice: req.query.minPrice || '',
            maxPrice: req.query.maxPrice || '',
            sort: sortOption || ''
        });
    } catch (error) {
        console.error("Error in loadShope:", error.message);
        res.status(500).send("Server error");
    }
};


const loadViewProduct = async(req,res)=>{
    try {
        const id = req.params.id

        const products =await product.findById(id)
        .populate('brand')
        .populate('category')

        if(!products.isListed){
          return  res.redirect('/user/shope')
        }


        const querySearch = req.query.search ? req.query.search.trim():""
        const filter={}
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
        }

        const relatedProducts=await product.find({
            category:products.category._id,
            _id:{$ne:id}
        })
        .populate('brand')
        .populate('category')
        



        res.render('user/viewProduct',{products,relatedProducts,search:querySearch})
    } catch (error) {
        console.log(error.message)
    }
}

const loadCategories = async(req,res)=>{
    try {
        const page = parseInt(req.query.page || 1)
        const limit=5
        const skip = (page -1)*limit

        const querySearch = req.query.search ? req.query.search.trim():""
        const filter={}
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
        }

        const categoryId = req.params.id
        const products = await product.find({category:categoryId}).skip(skip).limit(limit)
        .populate('brand')
        .populate('category')
       const totalDocuments = await product.countDocuments({category:categoryId})
       const totalPages = await Math.ceil(totalDocuments/limit)
       res.render('user/categories',{products,currentPage:page,totalPages,search:querySearch})
        
    } catch (error) {
        console.log("Error ",error)
    }
}




module.exports={
    loadShope,
    loadViewProduct,
    loadCategories,
   
}