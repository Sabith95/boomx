const Order = require('../models/orderModel')
const PDFDocument = require('pdfkit')
const product = require('../models/productModel')
const User = require('../models/userModel')
const Wallet = require('../models/walletModel')
const AdminWallet = require('../models/adminWalletModel')

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

        if (order.paymentMethod === 'razorpay') {
            // If it's a Razorpay order but no payment status is set
            if (!order.paymentStatus) {
                // Set to Pending or Failed based on your business logic
                order.paymentStatus = order.razorpayOrderId ? 'Approved' :'Failed'
                await order.save()
            }

            if (order.status === 'Failed' || order.razorpayOrderId === null) {
                order.paymentStatus = 'Failed'
                await order.save()
            }
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

const generateInvoice = async (req, res) => {
    try {
        const orderNumber = req.params.id

        const order = await Order.findOne({user: req.user._id, orderNumber: orderNumber})
        .populate('items.product')

        if(!order){
            return res.status(400).send("Order not found")
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderNumber}.pdf`);

        // Create a new PDF document
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });
        doc.pipe(res); // Pipe the generated PDF to the response

        
        
        // Add company info on the right
        doc.fontSize(10).text('BoomX', 400, 45, { align: 'right' });
        doc.fontSize(8)
           .text('123 Business Street', 400, 60, { align: 'right' })
           .text('Bangalore, India, 654321', 400, 70, { align: 'right' })
           .text('Phone: (123) 456-7890', 400, 80, { align: 'right' })
           .text('Email: contact@boomx.com', 400, 90, { align: 'right' });

        // Add a horizontal line
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, 120).lineTo(550, 120).stroke();
        
        // Add invoice title and number
        doc.fontSize(20).fillColor('#444444').text('INVOICE', 50, 150);
        doc.fontSize(10).fillColor('#666666')
           .text(`Invoice Number: ${order.orderNumber}`, 50, 180)
           .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 195)
           .text(`Due Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 210);

        // Add customer information
        doc.fontSize(10).text('Bill To:', 300, 180)
           .text(`${order.address.name}`, 300, 195)
           .text(`${order.address.streetAddress}`, 300, 210)
           .text(`${order.address.city}, ${order.address.state}, ${order.address.pinCode}`, 300, 225)
           .text(`${order.address.country}`, 300, 240)
           .text(`Phone: ${order.address.phone}`, 300, 255);

        // Create table header
        const tableTop = 300;
        doc.font('Helvetica-Bold').fillColor('#444444');
        doc.fontSize(10).text('Item', 50, tableTop);
        doc.text('Quantity', 250, tableTop, { width: 90, align: 'center' });
        doc.text('Unit Price', 340, tableTop, { width: 90, align: 'right' });
        doc.text('Amount', 430, tableTop, { width: 90, align: 'right' });

        // Add table divider
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        // Add items
        let position = tableTop + 30;
        doc.font('Helvetica').fillColor('#666666');
        
        order.items.forEach((item, index) => {
            doc.fontSize(10).text(item.product.name, 50, position);
            doc.text(item.quantity.toString(), 250, position, { width: 90, align: 'center' });
            doc.text(`₹${item.priceAddition.toFixed(2)}`, 340, position, { width: 90, align: 'right' });
            doc.text(`₹${item.subtotal.toFixed(2)}`, 430, position, { width: 90, align: 'right' });
            position += 20;
        });

        // Add table divider for totals
        position += 30;
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(300, position - 15).lineTo(550, position - 15).stroke();
        
        // Clearly define columns for summary section
        const labelX = 350; // Left-aligned column for labels
        const amountX = 500; // Right-aligned column for amounts
        
        // Subtotal row with clear separation
        doc.font('Helvetica').fillColor('#666666');
        doc.text('Subtotal:', labelX, position);
        doc.text(`₹${order.subtotal.toFixed(2)}`, amountX, position, { align: 'right' });
        
        // Tax row
        position += 20;
        doc.text('Tax:', labelX, position);
        doc.text(`₹${order.tax.toFixed(2)}`, amountX, position, { align: 'right' });
        
        // Total row with highlight
        position += 20;
        doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(300, position - 10).lineTo(550, position - 10).stroke();
        position += 10;
        doc.font('Helvetica-Bold').fillColor('#333333');
        doc.text('Total:', labelX, position);
        doc.text(`₹${order.total.toFixed(2)}`, amountX, position, { align: 'right' });

        // Add a note
        position += 60;
        doc.font('Helvetica').fontSize(10).fillColor('#666666').text('Thank you for your business!', 50, position);
        
        // Add payment details
        position += 20;
        doc.text('Payment Details:', 50, position);
        position += 15;
        doc.text('Bank: HDFC Bank', 50, position);
        position += 15;
        doc.text('Account Name: BoomX Ltd.', 50, position);
        position += 15;
        doc.text('Account Number: 65434321567', 50, position);
        position += 15;
        doc.text('IFSC: HDFC005432123', 50, position);

        // Add footer
        const footerTop = doc.page.height - 50;
        doc.fontSize(8).text('Invoice was created on a computer and is valid without the signature and seal.', 50, footerTop, {
            align: 'center'
        });
        
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

       

        if(order.paymentMethod && order.paymentMethod.toLocaleLowerCase() === 'razorpay'){
            let wallet = await Wallet.findOne({user:order.user})
                        if (!wallet) {
                            wallet = new Wallet({ user: order.user, balance: 0 });
                         
                        }
            
                        wallet.balance += order.total
                        await wallet.save()

                const adminWalletTxn = new AdminWallet({
                    user:order.user,
                    transactionType:'debit',
                    source:'Order Cancelled',
                    amount:order.total,
                    admin:process.env.ADMIN_ID,
                    order:order._id
                })

                await adminWalletTxn.save()
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