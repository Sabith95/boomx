const Address=require('../models/addressModel')
const Cart=require('../models/cartModel')
const User= require('../models/userModel')
const Order=require('../models/orderModel')
const product = require('../models/productModel')

const loadCheckOut= async(req,res)=>{
    try {
        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
           
        }

        const itemId = req.query.itemId
        const cart = await Cart.findOne({user:req.user._id}).populate('items.product')

        let cartItems = cart ? cart.items:[]

        const user=await User.findById(req.user._id).populate('addresses')

        if(itemId){

            cartItems =cartItems.filter(item => item.product._id.toString() === itemId)
        }
        
        const addresses=user.addresses || []
        const paymentMethod='cod'

        const newSubTotal= cartItems.reduce((sum,item)=>{
            return sum + (item.priceAddition * item.quantity)
        },0)

        const newTotal= newSubTotal

        const defaultAddress= addresses.find(address => address.isDefault)
        const selectedAddressId=defaultAddress ? defaultAddress._id.toString() :null

        res.render('user/checkOut',{search:querySearch,addresses,paymentMethod,
            user:req.user,
            cartItems,
            selectedAddressId,
            subtotal:newSubTotal,
            tax:0,
            total:newTotal
        })
    } catch (error) {
        console.error("Error loading checkout:", error);
        res.status(500).send("Server Error");
    }
}

const placeOrder=async(req,res)=>{
    try {
        const {addressId,paymentMethod,cartItems,subtotal,tax,total} = req.body
        const userId = req.user._id
        const user= await User.findById(userId)

        if(!addressId){
            return res.status(400).json({
                succes:false,
                message:'Shipping address is required'
            })
        }

        if(!cartItems || cartItems.length === 0){
            return res.status(400).json({
                success:false,
                message:'Your cart is empty'
            })
        }

        if(paymentMethod !== 'cod'){
            return res.status(400).json({
                success:false,
                message:'Unsopported paymen method'})
        }

        const userWithAddress = await User.findById(req.user._id).populate('addresses')
        const address = userWithAddress.addresses.find(addr => addr._id.toString() === addressId)  
        const fullAddress= address.toObject ? address.toObject() :address      
        if(!address){
            return res.status(400).json({
                succes:false,
                message:'Invalid shipping address'
            })
        }

        const order=new Order({
            user:req.user._id,
            userName:user.name,
            address:fullAddress,
            items:cartItems,
            paymentMethod:paymentMethod,
            subtotal:subtotal,
            tax:tax,
            total:total,
            status:'Pending'
        })

        await order.save()

       for(let item of cartItems){
        const productId = item.product._id ? item.product._id : item.product
        await product.findByIdAndUpdate(
            productId,
            {$inc:{quantity : -item.quantity}}
        )
       }

//clear cart 
        await Cart.findOneAndUpdate({user:req.user._id},{items:[]})
        res.json({ success: true, orderId: order.orderNumber || order._id.toString() });

    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ success: false, message: "Server error placing order." });
    }
}

const loadConfirmation = async (req, res) => {
    try {
      const querySearch = req.query.search ? req.query.search.trim() : '';
      const orderId = req.params.id;
      
      const order = await Order.findOne({ user: req.user._id, orderNumber: orderId })
        .populate('address') // temporarily remove population to check query
        .populate('items.product');
  
      if (!order) {
        console.error("Order not found for orderId:", orderId, "and user:", req.user._id);
        return res.status(400).json({ success: false, message: "order not completed" });
      }
  
      res.render('user/orderSuccess', {
        search: querySearch,
        user: req.user,
        order: order,
        orderId: order.orderNumber || order._id.toString()
      });
    } catch (error) {
      console.error("Error loading confirmation page:", error);
      res.status(500).send("Server Error");
    }
  };
  
module.exports = {
    loadCheckOut,
    placeOrder,
    loadConfirmation
}