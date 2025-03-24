const { findOne } = require('../models/counterModel');
const Order = require('../models/orderModel')
const jwtHelper = require('../utils/jwtHelper');
const Wallet = require('../models/walletModel')

const loadOrders = async(req,res)=>{
    try {
        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
             return res.redirect('/admin/login');
         }
         const{search,status,date_from,date_to,sort,} = req.query
         console.log(req.query)
         const page =parseInt(req.query.page) || 1
         const limit = 5
         const skip = (page-1)*limit 
        
        const filter= {}

        if(search){
            filter.$or=[
                {orderNumber:{$regex : search, $options : 'i'}},
                {userName:{$regex : search, $options : 'i'}}
            ]
        }

        if(status){
            filter.status = status
        }

        if(date_from || date_to){
            filter.createdAt ={}
            if(date_from){
                filter.createdAt.$gte = new Date(date_from)
            }
            if(date_to){
                filter.createdAt.$lte = new Date(date_to)
            }

        }

        let sortOption ={}
        switch(sort){
            case 'date_asc':
                sortOption.createdAt = 1
                break
            case 'total_desc':
                sortOption.total = -1
                break;
            case 'total_asc':
                sortOption.total = 1
                break
            case 'date_desc':
                default:
                sortOption.createdAt = -1
                break
            
        }
        const orders = await Order.find(filter).sort(sortOption).skip(skip).limit(limit).populate('user')

        const totalItems = await Order.countDocuments()
        const totalPages = await Math.ceil(totalItems / limit)



        res.render('admin/orders',{orders,currentPage:page,totalPages})

        
              
    } catch (error) {
       console.log(error) 
    }
}

const updateStatus=async(req,res)=>{
    try {
        const orderId= req.params.id
        const {status} = req.body

       const order = await Order.findOne({orderNumber:orderId})
       if(!order){
        return res.status(404).json({ success: false, error: "Order not found" });
       }

       order.status = status;
       await order.save();

       return res.json({ success: true, message: "Order status updated successfully" });

    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
}

const loadOrderDetail=async(req,res)=>{
    try {
        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
             return res.redirect('/admin/login');
         }

         const orderId = req.params.id
         const orders = await Order.findOne({orderNumber:orderId})
         .populate('items.product')

         if(!orders){
            return res.status(400).send("Order not found")
         }

         res.render('admin/orderDetail',{order:orders})

    } catch (error) {
        console.log(error)
    }
}

const returnStatus = async(req,res)=>{
    try {
        const orderId = req.params.id
        const {returnAction} = req.body

        const order = await Order.findOne({orderNumber:orderId})
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        if (!order.returnRequest.requested || order.returnRequest.returnStatus !== 'Pending') {
            return res.status(400).json({ success: false, error: 'No pending return request for this order' });
        }

        if(returnAction === 'approve'){
            order.returnRequest.returnStatus = "Approved"

            order.status ="Returned"

            order.returnRequest.refundAmount = order.total

            let wallet = await Wallet.findOne({user:order.user})
            if (!wallet) {
                wallet = new Wallet({ user: order.user, balance: 0 });
             
            }

            wallet.balance += order.returnRequest.refundAmount
            await wallet.save()
        }
     else if (returnAction === 'reject') {
        order.returnRequest.returnStatus = 'Rejected';
      } 
      else {
        return res.status(400).json({ success: false, error: 'Invalid return action' });
      }

      await order.save()

      return res.json({ success: true, message: `Return request ${returnAction}d successfully` });


    } catch (error) {
       return res.status(500).json({ success: false, error: error.message }); 
    }
}

module.exports = {
    loadOrders,
    updateStatus,
    loadOrderDetail,
    returnStatus
}