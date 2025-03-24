const Order = require('../models/orderModel')
const PDFDocument = require('pdfkit')
const product = require('../models/productModel')

const loadOrderDetail=async(req,res)=>{
    try {

        const orderNumber = req.params.id

        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
           
        }

        const order = await Order.findOne({
            user:req.user._id,orderNumber:orderNumber
        })
        .populate('items.product')
        

        if(!order){
            return res.status(400).json({success:false,message:'Order not found'})
        }

        res.render('user/orderDetail',{
            user:req.user,
            order:order,
            orderNumber:orderNumber,
            search:querySearch
        })
    } catch (error) {
        console.error("Error loading order detail:", error);
        res.status(500).send("Server Error");
    }
}

const generateInvoice=async(req,res)=>{
    try {
        const orderNumber = req.params.id

        const order = await Order.findOne({user:req.user._id,orderNumber:orderNumber})
        .populate('items.product')

        if(!order){
            return res.status(400).send("Order not found")
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderNumber}.pdf`);

          // Create a new PDF document
    const doc = new PDFDocument();
    doc.pipe(res); // Pipe the generated PDF to the response

    // Add invoice header
    doc.fontSize(20).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
    doc.text(`Order Date: ${order.createdAt.toDateString()}`);
    doc.text(`Customer: ${order.address.name}`);
    doc.moveDown();

    // Add a table of items
    doc.fontSize(14).text('Items:', { underline: true });
    order.items.forEach((item, index) => {
      doc.fontSize(12)
        .text(`${index + 1}. ${item.product.name} - Qty: ${item.quantity} - Price: ₹${item.priceAddition.toFixed(2)} - Subtotal: ₹${item.subtotal.toFixed(2)}`);
    });
    doc.moveDown();

    // Add totals
    doc.fontSize(12).text(`Subtotal: ₹${order.subtotal.toFixed(2)}`);
    doc.text(`Tax: ₹${order.tax.toFixed(2)}`);
    doc.text(`Total: ₹${order.total.toFixed(2)}`);
    doc.moveDown();

    // Add shipping address details
    doc.fontSize(14).text('Shipping Address:', { underline: true });
    const addr = order.address;
    doc.fontSize(12)
      .text(addr.name)
      .text(addr.streetAddress)
      .text(`${addr.city}, ${addr.state}, ${addr.pinCode}`)
      .text(addr.country)
      .text(`Phone: ${addr.phone}`);
    
    // Finalize the PDF and end the stream
    doc.end();

    } catch (error) {
        console.error("Error generating invoice:", error);
        res.status(500).send("Error generating invoice.");
    }
}

const cancelOrder = async(req,res)=>{
    try {
        const orderId = req.params.id
        const {cancelReason} = req.body

        if (!cancelReason || !cancelReason.trim()) {
            return res.status(400).json({ success: false, error: "Cancel reason is required" });
          }

        const order= await Order.findOne({orderNumber:orderId})
        if(!order){
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        if(order.status === "Delivered "){
            return res.status(400).json({ success: false, error: "Cannot cancel a delivered order" });
        }

        if(order.status === "Returned"){
            return res.status(400).json({ success: false, error: "Cannot cancel a returned order" });
        }

        if(order.status === 'Cancelled'){
            return res.status(400).json({ success: false, error: "Order is already cancelled" });  
        }

        for (const item of order.items){
            await product.findByIdAndUpdate(
                item.product._id,
                {$inc:{quantity: item.quantity}}
            )
        }

        order.status= 'Cancelled'
        await order.save()

        return res.json({ success: true, message: "Order has been canceled successfully" });
    } catch (error) {
        console.error("Error canceling order:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
}

const returnRequest=async(req,res)=>{
    try {
        const orderId = req.params.id
        const {returnReason} = req.body

        const order = await Order.findOne({orderNumber:orderId})
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        if(order.returnRequest.requested){
            return res.status(400).json({ 
                success: false, 
                error: 'Return request has already been submitted for this order.' 
              });
        }

        order.returnRequest.requested = true;
        order.returnRequest.requestDate = new Date();
        order.returnRequest.returnReason = returnReason;
        order.returnRequest.returnStatus = 'Pending';

        await order.save()

        return res.json({ success: true, message: 'Return request submitted' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports={
    loadOrderDetail,
    generateInvoice,
    cancelOrder,
    returnRequest
}