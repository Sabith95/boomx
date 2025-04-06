const Address=require('../models/addressModel')
const Cart=require('../models/cartModel')
const User= require('../models/userModel')
const Order=require('../models/orderModel')
const product = require('../models/productModel')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { query } = require('../models/cartItemModel')
const Coupon = require('../models/couponModel')
const AdminWallet = require('../models/adminWalletModel')

const loadCheckOut= async(req,res)=>{
    try {
        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
           
        }

        const globalCoupons = await Coupon.find({
            $or: [
              { userId: { $exists: false } },
              { userId: null }
            ],
            couponType: { $ne: 'referral' }, 
            isActive: true,
            expiryDate: { $gt: new Date() }
          });

          const referralCoupons = await Coupon.find({
            userId: req.user._id,
            couponType: 'referral',
            isActive: true,
            expiryDate: { $gt: new Date() }
          });

        const coupons = globalCoupons.concat(referralCoupons)
        
        const cart = await Cart.findOne({user:req.user._id}).populate('items.product')

        let cartItems = cart ? cart.items:[]

        const discount = cart ? (cart.discount || 0) : 0

        const user=await User.findById(req.user._id).populate('addresses')
        
        const addresses=user.addresses || []
        const paymentMethod='cod'

        const newSubTotal= cartItems.reduce((sum,item)=>{
            return sum + (item.priceAddition * item.quantity)
        },0)

        let shipping = 0
        if(newSubTotal >20000){
            shipping = 100
        }else{
            shipping = 0
        }
        const newTotal = newSubTotal - discount - shipping

        const defaultAddress= addresses.find(address => address.isDefault)
        const selectedAddressId=defaultAddress ? defaultAddress._id.toString() :null

        res.render('user/checkOut',{search:querySearch,addresses,paymentMethod,
            user:req.user,
            cartItems,
            selectedAddressId,
            subtotal:newSubTotal,
            tax:0,
            discount,
            total:newTotal,
            razorpayKey: process.env.RAZORPAY_KEY_ID,
            coupons,
            shipping:shipping
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
                success:false,
                message:'Shipping address is required'
            })
        }

        if(!cartItems || cartItems.length === 0){
            return res.status(400).json({
                success:false,
                message:'Your cart is empty'
            })
        }

        if(paymentMethod !== 'cod' && paymentMethod !== 'razorpay'){
            return res.status(400).json({
                success:false,
                message:'Unsopported payment method'})
        }

        const userWithAddress = await User.findById(req.user._id).populate('addresses')
        const address = userWithAddress.addresses.find(addr => addr._id.toString() === addressId)  
        const fullAddress= address.toObject ? address.toObject() :address  
        
        const formattedAddress = {
            name:fullAddress.name,
            phone:fullAddress.phone,
            streetAddress:fullAddress.streetAddress,
            city:fullAddress.city,
            state:fullAddress.state,
            pinCode:fullAddress.pinCode,
            country:fullAddress.country
        }
        if(!address){
            return res.status(400).json({
                success:false,
                message:'Invalid shipping address'
            })
        }
        
        

        if(paymentMethod === 'cod'){
            const orderData = {
                user: req.user._id,
                userName: user.name,
                address: formattedAddress,
                items: cartItems,
                paymentMethod: paymentMethod,
                subtotal: subtotal,
                tax: tax,
                total: total,
                status: 'Pending',
                discount: 0
              };

            const cart = await Cart.findOne({user:req.user._id})
            orderData.discount = cart ? (cart.discount || 0) : 0 

            if(total > 20000){
                return res.status(400).json({
                    success:false,
                    message:'Cash on delivery is not available for orders above 20,000'
                })
            }

            const order = new Order(orderData)
            await order.save()
    
           for(let item of cartItems){
            const productId = item.product._id ? item.product._id : item.product
            await product.findByIdAndUpdate(
                productId,
                {$inc:{quantity : -item.quantity}}
            )
           }
    
    //clear cart 
            await Cart.findOneAndUpdate({user:req.user._id},{items:[],discount:0,total:0})
            res.json({ success: true, orderId: order.orderNumber || order._id.toString() });
        }

        if(paymentMethod === 'razorpay'){
            const razorpayInstance = new Razorpay ({
                key_id:process.env.RAZORPAY_KEY_ID,
                key_secret:process.env.RAZORPAY_KEY_SECRET,
            })

            const options ={
                amount : total * 100,
                currency : 'INR',
                payment_capture : 1,
            }

            const razorpayOrder = await razorpayInstance.orders.create(options)
            if(!razorpayOrder){
                return res.status(400).json({
                    succes:false,
                    message:'Error creating razorpay order'
                })
            }

            const order= new Order ({
                user:req.user._id,
                userName:user.name,
                address:formattedAddress,
                items:cartItems,
                paymentMethod:paymentMethod,
                subtotal:subtotal,
                tax:tax,
                total:total,
                status:"Pending",
                razorpayOrderId:razorpayOrder.id,
                discount:0
            })
            const cart = await Cart.findOne({ user: req.user._id });
            order.discount = cart.discount ? (cart.discount || 0 ) : 0

            await order.save()

            return res.json({
                success:true,
                orderId:order.orderNumber || order._id.toString(),
                razorpayOrderId:razorpayOrder.id,
                amount:razorpayOrder.amount,
                currency:razorpayOrder.currency
            })
        }



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
        .populate('address') 
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

  const verifyPayment = async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
  
      
      const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
  
      if (expectedSignature === razorpay_signature) {

        order.paymentStatus = "Paid";
        await order.save();

        for (let item of order.items){

            const prodId = item.product._id ? item.product._id: item.product
            await product.findByIdAndUpdate(prodId,
                {$inc :{quantity : -item.quantity}}
                
            )
        }

        await Cart.findOneAndUpdate({user:req.user._id}, {items : [],coupon:null,discount:0,total:0 })

        const adminWalletTxn = new AdminWallet({
            user:req.user._id,
            transactionType:'credit',
            amount:order.total,
            source:'Razorpay',
            order:order._id,
            admin:process.env.ADMIN_ID
        })

        await adminWalletTxn.save()
        
        return res.json({ success: true, message: "Payment verified successfully",paymentStatus:order.paymentStatus });
      } else {
        order.paymentStatus = "Failed";
        order.status = 'Failed'
        await order.save();
        return res.status(400).json({ success: false, message: "Payment verification failed",paymentStatus:order.paymentStatus });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      return res.status(500).json({ success: false, message: "Server error verifying payment" });
    }
  };
  

  const retryOrder =async(req,res)=>{
    try {
        const orderId = req.params.id

        const order = await Order.findOne({orderNumber:orderId,user:req.user._id})
        if(!order){
            return res.status(400).json({success:false,message:'Order not found'})
        }

        if(order.paymentMethod !== 'razorpay' || order.status === 'Paid'){
            return res.status(400).json({ success: false, message: 'Order is not eligible for payment retry' });
        }

        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });

          const amountInPaise = order.total * 100
          const options ={
            amount : amountInPaise,
            currency : 'INR',
            payment_capture : 1,
        }
        
        const razorpayOrder = await razorpayInstance.orders.create(options)
        if (!razorpayOrder) {
            return res.status(500).json({ success: false, message: 'Error creating new Razorpay order' });
          }
// Update the existing order with the new Razorpay order ID
          order.paymentStatus='Pending'
          order.razorpayOrderId = razorpayOrder.id;
          order.status = 'Pending';
          await order.save();  

          return res.json({
            success: true,
            orderId: order.orderNumber,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
          }); 

    } catch (error) {
        console.error("Error in retryOrder:", error);
        res.status(500).json({ success: false, message: "Server error retrying payment." });
    }
  }

  const loadFailure=async(req,res)=>{
    try {
        const orderId = req.params.id

        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
           
        }

        const order =await Order.findOne({orderNumber:orderId,user:req.user._id})
        if(!order){
            return res.status(404).render('user/orderFailure', { orderId, error: 'Order not found' });  
        }

        order.paymentStatus ='Failed'
        order.status = 'Failed'
        await order.save()

        res.render('user/orderFailure',{orderId,order,search:querySearch,razorpayKey: process.env.RAZORPAY_KEY_ID})
    } catch (error) {
        console.error("Error loading failure page:", error);
        res.status(500).send("Server error loading order failure page.");
    }
  }

  const applyCoupon = async(req,res)=>{
    try {
        const {couponCode} = req.body
        
        const cart = await Cart.findOne({user:req.user._id}).populate('items.product')        
        if(!cart){
            return res.status(400).json({
                success:false,
                message:'Cart not found'
            })
        }
 // Prevent applying more than one coupon at a time
        if(cart.discount && cart.discount > 0){
            return res.status(400).json({
                success:false,
                message:'A coupon is already applied'
            })
        }

        const coupons = await Coupon.findOne({code:couponCode,isActive:true})
        if(!coupons){
            return res.status(400).json({
                success:false,
                message:'Invalid coupon code'
            })
        }

        if(coupons.expiryDate && new Date(coupons.expiryDate) < new Date()){
            return res.status(400).json({
                success:false,
                message:'Coupon has expired'
            })
        }

        const previousOrder =await Order.findOne({
            user:req.user._id,
            coupon:coupons._id
        })
        if(previousOrder){
            return res.status(400).json({
                success: false,
                message: 'You have already used this coupon'
              });
        }

        const originalTotal = cart.items.reduce((acc,item) => acc + (item.subtotal) || 0,0)
        if(originalTotal < coupons.minimumPurchase){
            return res.status(400).json({
                success:false,
                message:`Minimum purchase of ₹${coupons.minimumPurchase} is required `
            })
        }

        // if(coupons.timeUsed >=coupons.usageLimit){
        //     return res.status(400).json({
        //         success:false,
        //         message:'Coupon usage limit reached'
        //     })
        // }

        const discount = (coupons.discountValue / 100) * originalTotal

        
        cart.discount = discount
        const total  = originalTotal - discount
        await cart.save()

        // coupons.timeUsed++
        await coupons.save()

        return res.status(200).json({
            coupons,
            discount,
            total:total,
            message:'Coupon applied successfully'
        })

    } catch (error) {

        console.error("Error applying coupon at checkout:", error);
        return res.status(500).json({ message: 'Server error applying coupon.' }); 
    }
  }

 const removeCoupon = async(req,res)=>{
    try {
        const {couponCode} = req.body
        console.log(req.body);
        
        
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        if (!cart || !cart.discount || !cart.discount === 0) {
          return res.status(400).json({ success: false, message: 'No coupon is applied.' });
        }

        const appliedCoupon = await Coupon.findOne({code:couponCode,isActive:true   })
        if(!appliedCoupon){
            return res.status(400).json({
                success:false,
                message:'Applied coupon not found'
            })
        }

        if(appliedCoupon.code !== couponCode){
            return res.status(400).json({ 
                success: false, 
                message: 'The coupon selected for removal does not match the applied coupon.' 
              }); 
        }

        if (appliedCoupon.timeUsed > 0) {
            appliedCoupon.timeUsed--;
            await appliedCoupon.save();
        }

        
        
        cart.discount = 0;

        const originalTotal = cart.items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
        const total  = originalTotal;
        await cart.save();

        return res.status(200).json({
        success: true,
        message: 'Coupon removed successfully',
        discount: 0,
        total: total
        });


    } catch (error) {
        console.error("Error removing coupon:", error);
        return res.status(500).json({ success: false, message: 'Server error removing coupon.' });
    }
 } 


module.exports = {
    loadCheckOut,
    placeOrder,
    loadConfirmation,
    verifyPayment,
    retryOrder,
    loadFailure,
    applyCoupon,
    removeCoupon
}