const jwtHelper = require('../utils/jwtHelper');
const Order = require('../models/orderModel')
const PDFdocument= require('pdfkit')
const ExcelJS = require('exceljs')

const loadSales = async(req,res)=>{
    try {

         const token = req.cookies.adminToken;
            if (!token || !jwtHelper.verifyToken(token)) {
                return res.redirect('/admin/login');
            }

        const page = parseInt(req.query.page) || 1
        const limit = 5
        const skip = (page - 1)* limit

        const orders = await Order.find().sort({createdAt:-1}).skip(skip).limit(limit)
        .populate('user','name email')
        .populate('items.product')

        const totalSales = await Order.aggregate([
            {$group:{_id:null,total : { $sum : "$total"}}}
        ])

        const totalOrders = await Order.countDocuments()

        const totalDiscounts = await Order.aggregate([ 
            {$group :{ _id: null,discount : { $sum : "$discount"}}}
        ])

        const totalItems = await Order.countDocuments()
        const totalPages = await Math.ceil(totalItems/limit)

        res.render('admin/salesReport',{
            orders,
            currentPage:page,
            totalPages,
            totalSales : totalSales[0]?.total || 0, 
            totalOrders,
            totalDiscounts: totalDiscounts[0]?.discount || 0
        })
    } catch (error) {
        console.error('Error loading sales report',error);
        res.status(500).send('Internal Server Error');res.status(500).send('Internal Server Error');
    }
}

const filterSales=async(req,res)=>{
    try {
        const {reportType,endDate,startDate} = req.body
        const page = parseInt(req.body.page) || 1
        const limit = 5
        const skip = (page -1) * limit

        let filter ={}

        if(reportType){
            const now = new Date()
            const referenceDate = startDate ? new Date(startDate) : now
            switch(reportType){
                case  'daily' : {
                    const dayStart = new Date(referenceDate)
                    dayStart.setHours(0,0,0,0)
                    const dayEnd = new Date(referenceDate)
                    dayEnd.setHours(223,59,59,999)
                    filter.createdAt = {$gte : dayStart , $lte : dayEnd}
                    break
                }
                case 'weekly' :{
                    const dayOfWeek =referenceDate.getDay()
                    const weekStart = new Date(referenceDate);
                    weekStart.setDate(referenceDate.getDate() - dayOfWeek);
                    weekStart.setHours(0, 0, 0, 0);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    filter.createdAt = { $gte: weekStart, $lte: weekEnd };
                    break;
                }
                case 'monthly' :{
                    const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
                    monthStart.setHours(0, 0, 0, 0);
                    const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
                    monthEnd.setHours(23, 59, 59, 999);
                    filter.createdAt = { $gte: monthStart, $lte: monthEnd };
                    break;
                }
                case 'yearly' :{
                    const yearStart = new Date(referenceDate.getFullYear(), 0, 1);
                    yearStart.setHours(0, 0, 0, 0);
                    const yearEnd = new Date(referenceDate.getFullYear(), 11, 31);
                    yearEnd.setHours(23, 59, 59, 999);
                    filter.createdAt = { $gte: yearStart, $lte: yearEnd };
                    break;
                }
                default:
                    break
            }
        }
        else{
            if(startDate && endDate){
                filter.createdAt = {$gte : new Date(startDate), $lte : new Date(endDate)}
            }
            else if(startDate){
                filter.createdAt = {$gt : new Date(startDate)}
            }
            else if(endDate){
                filter.createdAt= {$lte : new Date(endDate)}
            }
        }

        const orders = await Order.find(filter)
            .sort({createdAt : -1})
            .skip(skip)
            .limit(limit)
            .populate('user','name email')
            .populate('items.product')

        const totalSalesAgg = await Order.aggregate([
            {$match : filter},
            {$group : {_id: null, total:{ $sum: "$total"}}}
        ]) 
        
        const totalSales = totalSalesAgg[0]?.total || 0

        const totalOrders = await Order.countDocuments(filter)

        const totalDiscountsAgg = await Order.aggregate([
            {$match: filter},
            {$group: {_id: null, discount: { $sum: "$discount"}}}
        ])

        const totalDiscounts = totalDiscountsAgg[0]?.discount || 0

        const totalPages = Math.ceil(totalOrders /limit)

        res.json({
            orders,
            currentPage: page,
            totalPages,
            totalSales,
            totalOrders,
            totalDiscounts
        });
        
    } catch (error) {
        console.error('Error filtering sales report', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const generatePdf = async (req, res) => {
    try {

        const token = req.cookies.adminToken;
            if (!token || !jwtHelper.verifyToken(token)) {
                return res.redirect('/admin/login');
            }


        const { reportType, startDate, endDate } = req.query;
        // If reportType is an empty string, set it to null
        const cleanReportType = reportType && reportType.trim() !== "" ? reportType.trim() : null;
        const cleanStartDate = startDate && startDate.trim() !== "" ? startDate.trim() : null;
        const cleanEndDate = endDate && endDate.trim() !== "" ? endDate.trim() : null;
        
        let filter = {};

        if (cleanReportType || cleanStartDate || cleanEndDate) {
            if (cleanReportType) {
                const now = new Date()
                const referenceDate = cleanStartDate ? new Date(cleanStartDate) : now;
                switch (cleanReportType) {
                    case 'daily': {
                        const dayStart = new Date(referenceDate);
                        dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(referenceDate);
                        dayEnd.setHours(23, 59, 59, 999);
                        filter.createdAt = { $gte: dayStart, $lte: dayEnd };
                        break;
                    }
                    case 'weekly': {
                        const dayOfWeek = referenceDate.getDay();
                        const weekStart = new Date(referenceDate);
                        weekStart.setDate(referenceDate.getDate() - dayOfWeek);
                        weekStart.setHours(0, 0, 0, 0);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        weekEnd.setHours(23, 59, 59, 999);
                        filter.createdAt = { $gte: weekStart, $lte: weekEnd };
                        break;
                    }
                    case 'monthly': {
                        const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
                        monthStart.setHours(0, 0, 0, 0);
                        const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
                        monthEnd.setHours(23, 59, 59, 999);
                        filter.createdAt = { $gte: monthStart, $lte: monthEnd };
                        break;
                    }
                    case 'yearly': {
                        const yearStart = new Date(referenceDate.getFullYear(), 0, 1);
                        yearStart.setHours(0, 0, 0, 0);
                        const yearEnd = new Date(referenceDate.getFullYear(), 11, 31);
                        yearEnd.setHours(23, 59, 59, 999);
                        filter.createdAt = { $gte: yearStart, $lte: yearEnd };
                        break;
                    }
                    default:
                        break;
                }
            } else if (cleanStartDate || cleanEndDate) {
                // If no reportType but dates are provided, apply date range filtering
                if (cleanStartDate && cleanEndDate) {
                    filter.createdAt = { $gte: new Date(cleanStartDate), $lte: new Date(cleanEndDate) };
                } else if (cleanStartDate) {
                    filter.createdAt = { $gte: new Date(cleanStartDate) };
                } else if (cleanEndDate) {
                    filter.createdAt = { $lte: new Date(cleanEndDate) };
                }
            }
        }
        // If no valid filter parameters provided, filter remains {} to return all orders.

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product');

        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
        doc.pipe(res);

        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Total Orders: ${orders.length}`, { align: 'left' });
        doc.moveDown();

        orders.forEach(order => {
            doc.fontSize(12).fillColor('black').text(`Order Number: #${order.orderNumber}`);
            doc.fontSize(10).text(`Date: ${new Date(order.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`);
            doc.fontSize(10).text(`Customer: ${order.user.name} (${order.user.email})`);
            doc.moveDown(0.25);
            doc.fontSize(10).text('Products:', { underline: true });
            order.items.forEach(item => {
                doc.fontSize(10).text(`- ${item.product.name}`);
            });
            doc.moveDown(0.25);
            doc.fontSize(10).text(`Subtotal: ₹${order.subtotal}`);
            doc.fontSize(10).text(`Discount: ₹${order.discount}`);
            doc.fontSize(10).text(`Total: ₹${order.total}`);
            doc.moveDown(1);
            doc.moveTo(doc.page.margins.left, doc.y)
               .lineTo(doc.page.width - doc.page.margins.right, doc.y)
               .stroke();
            doc.moveDown(1);
        });

        doc.end();

    } catch (error) {
        console.error('Error generating PDF sales report', error);
        res.status(500).send('Error generating PDF');
    }
};

const generateExcel =async(req,res)=>{
    try {

        const token = req.cookies.adminToken;
            if (!token || !jwtHelper.verifyToken(token)) {
                return res.redirect('/admin/login');
            }

            
        const { reportType, startDate, endDate } = req.query;
        const cleanReportType = reportType && reportType.trim() !== "" ? reportType.trim() : null;
        const cleanStartDate = startDate && startDate.trim() !== "" ? startDate.trim() : null;
        const cleanEndDate = endDate && endDate.trim() !== "" ? endDate.trim() : null;

        let filter = {};

        if (cleanReportType || cleanStartDate || cleanEndDate) {
          if (cleanReportType) {
            const now = new Date();
            const referenceDate = cleanStartDate ? new Date(cleanStartDate) : now;
            switch (cleanReportType) {
              case 'daily': {
                const dayStart = new Date(referenceDate);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(referenceDate);
                dayEnd.setHours(23, 59, 59, 999);
                filter.createdAt = { $gte: dayStart, $lte: dayEnd };
                break;
              }
              case 'weekly': {
                const dayOfWeek = referenceDate.getDay();
                const weekStart = new Date(referenceDate);
                weekStart.setDate(referenceDate.getDate() - dayOfWeek);
                weekStart.setHours(0, 0, 0, 0);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                filter.createdAt = { $gte: weekStart, $lte: weekEnd };
                break;
              }
              case 'monthly': {
                const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
                monthStart.setHours(0, 0, 0, 0);
                const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);
                filter.createdAt = { $gte: monthStart, $lte: monthEnd };
                break;
              }
              case 'yearly': {
                const yearStart = new Date(referenceDate.getFullYear(), 0, 1);
                yearStart.setHours(0, 0, 0, 0);
                const yearEnd = new Date(referenceDate.getFullYear(), 11, 31);
                yearEnd.setHours(23, 59, 59, 999);
                filter.createdAt = { $gte: yearStart, $lte: yearEnd };
                break;
              }
              default:
                break;
            }
          } else if (cleanStartDate || cleanEndDate) {
            if (cleanStartDate && cleanEndDate) {
              filter.createdAt = { $gte: new Date(cleanStartDate), $lte: new Date(cleanEndDate) };
            } else if (cleanStartDate) {
              filter.createdAt = { $gte: new Date(cleanStartDate) };
            } else if (cleanEndDate) {
              filter.createdAt = { $lte: new Date(cleanEndDate) };
            }
          }
        }
    
        const orders = await Order.find(filter)
          .sort({ createdAt: -1 })
          .populate('user', 'name email')
          .populate('items.product');

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Sales-Report')

        worksheet.columns =[
            { header: 'Sr No.', key: 'srNo', width: 8 },
            { header: 'Order ID', key: 'orderId', width: 15 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Customer', key: 'customer', width: 25 },
            { header: 'Products', key: 'products', width: 40 },
            { header: 'Subtotal', key: 'subtotal', width: 15 },
            { header: 'Discount', key: 'discount', width: 15 },
            { header: 'Total', key: 'total', width: 15 }
        ]

        orders.forEach((order, index) => {
            const products = order.items.map(item => item.product.name).join(', ');
            worksheet.addRow({
              srNo: index + 1,
              orderId: `#${order.orderNumber}`,
              date: new Date(order.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
              customer: `${order.user.name} (${order.user.email})`,
              products: products,
              subtotal: order.subtotal,
              discount: order.discount,
              total: order.total
            });
          });

          worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
          });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
      
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Excel sales report', error);
        res.status(500).send('Error generating Excel');
    }
}


module.exports={
    loadSales,
    filterSales,
    generatePdf,
    generateExcel
}