const Cart= require('../models/cartModel')
const product=require('../models/productModel')
const Wishlist = require('../models/wishlistModel')

const loadCart=async(req,res)=>{
    try {

        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
           
        }

        let cart= await Cart.findOne({user:req.user._id}).populate('items.product')
        if(!cart){
            cart= {items:[],total:0}
        }

        const recalculatedSubtotal = cart.items.reduce((sum,item)=>{
            return sum + (item.priceAddition * item.quantity)
        },0)

        const recalculatedTotal=recalculatedSubtotal
        

        res.render('user/cart',{search:querySearch,
            cartItems:cart.items,
            subtotal:recalculatedSubtotal,
            tax:0,
            total:recalculatedTotal
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
}


const addToCart=async(req,res)=>{
    try {
        const {productId,quantity}=req.body
        console.log(req.body)

        if(!productId){
            return res.status(400).json({success:false,message:'Product not found'})
        }
        const products=await product.findById(productId).populate('category')
        if(!products){
            return res.status(400).json({success:false,message:"Product not found"})
        }

        const qty =quantity ? parseInt(quantity):1

        if(!products.isListed || (products.category && products.category.isListed===false)){
            return res.status(400).json({success:false,message:'Product or its category is blocked'})
        }

        const MAX_Allowed_Quantity= 5


        if(qty>MAX_Allowed_Quantity){
            return res.status(400).json({
                success:false,message:`You can only add up to ${MAX_Allowed_Quantity} units of this product`})
        }

        if(qty > products.quantity){
            return res.status(400).json({
                success:false,
                message:"Requested quantity exceeds available stock"
            })
        }

           // Find the cart for the current user; if not found, create a new cart.

           let cart= await Cart.findOne({user:req.user._id})
           if(!cart){
            cart = new Cart({user:req.user._id,items:[]})
           }

           const itemIndex= cart.items.findIndex(item=> item.product.toString() === productId)

           if(itemIndex > -1){

            const newQuantity = cart.items[itemIndex].quantity+qty

            if(newQuantity > MAX_Allowed_Quantity){
                return res.status(400).json({
                    success:false,
                    message:`Maximum allowed quantity per product is ${MAX_Allowed_Quantity}`
                })
            }

            
            if(newQuantity > products.quantity){
                return res.status(400).json({success:false,message:'Cannot add morethan available stock'})
            }
             // Update quantity and subtotal if it exists

            cart.items[itemIndex].quantity += qty
            cart.items[itemIndex].subtotal =cart.items[itemIndex].quantity * products.salePrice
           }

           else{

            cart.items.push({
                product:productId,
                quantity:qty,
                priceAddition:products.salePrice,
                subtotal:qty*products.salePrice
            })
           }

           cart.total= cart.items.reduce((acc,item)=> acc + item.subtotal,0)
           await cart.save()

           await Wishlist.findOneAndUpdate(
            {user:req.user._id},
            {$pull:{products:productId}}
           )

           res.json({success:true,cart})




    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

const removeCart=async(req,res)=>{
    try {
        const productId=req.params.id
       
        const cart=await Cart.findOneAndUpdate(
            {user:req.user._id},
            {$pull:{items:{product:productId}}},
            {new:true}
        ) 

        if(!cart){
            return res.status(400).json({success:false,message:"Cart item not found"})
        }

        cart.calculateTotal();
        await cart.save();

        return res.status(200).json({
            success:true,
            message:"Cart removed successfully"
        })
    } catch (error) {
        console.error("Error deleting cart item:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error"
    })
    }
}

const updateQuantity=async(req,res)=>{
    try {

        const {itemId,quantity}=req.body
        const newQuantity = parseInt(quantity)

        if(!itemId || isNaN(newQuantity) || newQuantity < 1){
            return res.status(400).json({success:false,message:'Invalid quantity'})
        }

        let cart = await Cart.findOne({user:req.user._id}).populate('items.product')
        if(!cart){
            return res.status(400).json({ success: false, message: "Cart not found." })
        }

        const cartItem = cart.items.id(itemId)
        if (!cartItem) {
            return res.status(400).json({ success: false, message: "Cart item not found." });
          }
        
         if(newQuantity > cartItem.product.quantity){
            return res.status(400).json({ success: false, message: "Requested quantity exceeds available stock." });
          }

        const MAX_ALLOWED =5
        if(newQuantity > MAX_ALLOWED){
            return res.status(400).json({ success: false, message: `You can only purchase up to ${MAX_ALLOWED} units of this product.` });
        }  

        cartItem.quantity = newQuantity

        cartItem.subtotal = cartItem.priceAddition * newQuantity

        cart.calculateTotal()
        await cart.save()

        return res.json({ success: true, message: "Cart updated successfully.", cart });

    } catch (error) {
        console.error("Error updating cart quantity:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}
module.exports={
    loadCart,
    addToCart,
    removeCart,
    updateQuantity
}