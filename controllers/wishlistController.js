const Wishlist= require('../models/wishlistModel')


const loadWishlist = async(req,res)=>{
    try {
        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
        }

        let wishlist= await Wishlist.findOne({user:req.user._id}).populate('products')
        
        let wishlistItems=wishlist ? wishlist.products:[]
        const wishlistCount = wishlistItems.length


        res.render('user/wishlist',{search:querySearch,
            wishlistItems,
            wishlistCount
            
        })
    } catch (error) {
        
    }
}

const addToWishlist=async(req,res)=>{
    try {
        
        const {productId}=req.body

        if(!productId)
            return res.status(400).json({success:false,message:"Product not found"})

        

        let wishlist = await Wishlist.findOne({user:req.user._id})
        if(!wishlist){
            wishlist=new Wishlist({user:req.user._id,products:[]})
        }

        if(!wishlist.products.includes(productId)){
            wishlist.products.push(productId)
            await wishlist.save()
        }

        res.json({success:true,message:"Product added to wishlist"})
    } catch (error) {
        console.error(error);
    res.status(500).json({ success: false, message: 'Failed to add product' });
    }
}

const deleteWishlist=async(req,res)=>{
    try {
        const productId= req.params.id

        const deleteWishlist= await Wishlist.findOneAndUpdate(
            {user:req.user._id},
            {$pull:{products:productId}},
            {new:true}
        )
        if(!deleteWishlist){
            return res.status(400).json({success:false,message:'Wishlist not found'})
        }

        return res.status(200).json({
            success:true,
            message:"Wishlist deleted successfully"
        })
    } catch (error) {
        console.error("Error deleting wishist:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error"
    })
}
}

module.exports={
    loadWishlist,
    addToWishlist,
    deleteWishlist
}