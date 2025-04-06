const Admin = require('../models/adminModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const jwtHelper = require('../utils/jwtHelper');
const adminAuth=require('../middlewares/adminAuth');
const Order = require('../models/orderModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Brand = require ('../models/brandModel')
const Category = require('../models/categoryModel')

const loadLogin = async(req,res)=>{
    try{
        res.render('admin/login')
    }
    catch(error){
        console.log(error.message);
        
    }
}
const verifyLogin=async(req,res)=>{
    try{ 
        const{email,password} =req.body
        const admin=await Admin.findOne({email})
        if(!admin){
            return res.status(400).json({message:"Admin not found"})
        }
        const passwordMatch = await bcrypt.compare(password,admin.password)
    
        
        if(!passwordMatch){
            return res.status(401).json({message:"Invalid username or password"})
        }

        const token = jwtHelper.generateToken({
            admin:{
                _id:admin._id,
                email:admin.email,
            },
        })

        res.cookie('adminToken',token,{
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            path:'/admin' 
        })

        res.status(200).json({message:"Login Success"})

        }
        catch(error){
            res.status(500).json({message:"Server Error"})
        }

    }

    
    const loadDashboard= async(req,res)=>{

        try {
            const token = req.cookies.adminToken;
          if (!token) {
            return res.redirect('/admin/login')
          }
          const decoded = jwtHelper.verifyToken(token);
          if (!decoded) {
            return res.redirect('/admin/login')
          }

          const totalSales = await Order.aggregate([
            {$match: {status: {$nin: ['Failed', 'Cancelled']}}},
            {$group: {_id: null, total: {$sum: '$total'}}}
          ])

          const totalOrders = await Order.countDocuments({status: {$nin: ['Failed', 'Cancelled']}})

          const totalCustomers = await User.countDocuments({ isListed: true })

          const avgOrderValue = totalSales.length > 0 && totalOrders > 0 ? (totalSales[0].total / totalOrders).toFixed(2) : 0

          const salesIncrease = 8.2
          const ordersIncrease = 5.3
          const customersIncrease = 12.1
          const aovIncrease =3.7

        //   const topProducts = await Order.aggregate([
        //     {$match: {status: {$nin: ['Failed' , 'Cancelled']}}},
        //     {$unwind: '$items'},
        //     {$group: {
        //         _id: '$items.product',
        //         totalSales: {$sum: {$multiply: ['$items.price' , '$items.quantity']}},
        //         totalQuantity: {$sum: '$items.quantity'}
        //     }},
        //     {$sort: {totalSales: -1}},
        //     {$limit: 10},
        //     {$lookup: {
        //         from:'products',
        //         localField: '_id',
        //         foreignField: '_id',
        //         as:'productDetails'
        //     }},
        //     {$unwind: '$productDetails'},
        //     {$project: {
        //         name:'productDetails.name',
        //         totalSales: 1,
        //         totalQuantity: 1
        //     }}
        //   ])

        //   const topCategories = await Order.aggregate([
        //     {$match: {status: {$nin: ['Failed' , 'Cancelled']}}},
        //     {$unwind: '$items'},
        //     {$lookup: {
        //         from: 'products',
        //         localField: 'items.product',
        //         foreignField: '_id',
        //         as: 'product'
        //     }},
        //     {$unwind: '$product'},
        //     {$group: {
        //         _id: '$product.category',
        //         totalSales: {$sum: {$multiply: ['$items.price' , '$items.quantity']}}
        //     }},
        //     {$sort: {totalSales: -1}},
        //     {$limit: 10},
        //     {$lookup: {
        //         from:'categories',
        //         localField: '_id',
        //         foreignField: '_id',
        //         as: 'categoryDetails'
        //     }},
        //     {$unwind: '$categoryDetails'},
        //     {$project: {
        //         name: '$categoryDetails.name',
        //         totalSales: 1
        //     }}
        //   ])

        //   const topBrands = await Order.aggregate([
        //     {$match: {status: {$nin: ['Failed' , 'Cancelled']}}},
        //     {$unwind: '$items'},
        //     {$lookup: {
        //         from: 'products',
        //         localField: 'items.product',
        //         foreignField: '_id',
        //         as: 'product'
        //     }},
        //     {$unwind: '$product'},
        //     {$group: {
        //         _id: '$product.brand',
        //         totalSales: {$sum: {$multiply: ['$items.price' , '$items.quantity']}}
        //     }},
        //     {$sort: {totalSales: -1}},
        //     {$limit: 10},
        //     {$lookup: {
        //         from:'brands',
        //         localField: '_id',
        //         foreignField: '_id',
        //         as: 'brandDetails'
        //     }},
        //     {$unwind: '$brandDetails'},
        //     {$project: {
        //         name: '$brandDetails.name',
        //         totalSales: 1
        //     }}
        //   ])


        // Fix for topProducts aggregation
const topProducts = await Order.aggregate([
    {$match: {status: {$nin: ['Failed', 'Cancelled']}}},
    {$unwind: '$items'},
    {$group: {
      _id: '$items.product._id',  // Notice the change here to access the embedded product
      name: {$first: '$items.product.name'},  // Get name directly from embedded product
      totalSales: {$sum: {$multiply: ['$items.priceAddition', '$items.quantity']}},
      totalQuantity: {$sum: '$items.quantity'}
    }},
    {$sort: {totalSales: -1}},
    {$limit: 10}
  ])
  
  // Fix for topCategories aggregation
  const topCategories = await Order.aggregate([
    {$match: {status: {$nin: ['Failed', 'Cancelled']}}},
    {$unwind: '$items'},
    {$lookup: {
      from: 'categories',
      // Convert the string ID to ObjectId
      let: { categoryId: { $toObjectId: '$items.product.category' } },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } }
      ],
      as: 'categoryDetails'
    }},
    {$unwind: {
      path: '$categoryDetails',
      preserveNullAndEmptyArrays: true
    }},
    {$group: {
      _id: '$items.product.category',
      name: {$first: {$ifNull: ['$categoryDetails.name', 'Unknown Category']}},
      totalSales: {$sum: {$multiply: ['$items.priceAddition', '$items.quantity']}}
    }},
    {$sort: {totalSales: -1}},
    {$limit: 10}
  ])
  
  // Fix for topBrands aggregation
  const topBrands = await Order.aggregate([
    {$match: {status: {$nin: ['Failed', 'Cancelled']}}},
    {$unwind: '$items'},
    {$lookup: {
      from: 'brands',
      // Convert the string ID to ObjectId
      let: { brandId: { $toObjectId: '$items.product.brand' } },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$brandId'] } } }
      ],
      as: 'brandDetails'
    }},
    {$unwind: {
      path: '$brandDetails',
      preserveNullAndEmptyArrays: true
    }},
    {$group: {
      _id: '$items.product.brand',
      name: {$first: {$ifNull: ['$brandDetails.name', 'Unknown Brand']}},
      totalSales: {$sum: {$multiply: ['$items.priceAddition', '$items.quantity']}}
    }},
    {$sort: {totalSales: -1}},
    {$limit: 10}
  ])

            const currentYear = new Date().getFullYear()
            const salesByYear = await getSalesByYear()
            const salesByMonth = await getSalesByMonth(currentYear);
            const salesByWeek = await getSalesByWeek();
            const salesByDay = await getSalesByDay();

  

        res.render("admin/dashboard",{
            totalSales,
            totalOrders,
            totalCustomers,
            avgOrderValue,
            salesIncrease,
            ordersIncrease,
            customersIncrease,
            aovIncrease,
            topProducts,
            topCategories,
            topBrands,
            salesByYear,
            salesByMonth,
            salesByWeek,
            salesByDay
        })
    
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).send('Server error');
        }
    }

    async function getSalesByYear() {
        const fiveYearsAgo = new Date()
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)

        return await Order.aggregate([
            {$match: {
                createdAt: {$gte: fiveYearsAgo},
                status: {$nin: ['Failed' , 'Cancelled']}
            }},
            {$group:{
                _id: {$year: '$createdAt'},
                totalSales: {$sum: '$total'}
            }},
            {$sort: { _id: 1}}
        ])
    }

    async function getSalesByMonth(year){
        const startDate =  new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31)

        return await Order.aggregate([
            {$match: {createdAt: {$gte: startDate, $lte: endDate},
            status: {$nin: ['Failed' , 'Cancelled']}
        }},
        {$group: {
            _id: {$month: "$createdAt"},
            totalSales: {$sum: '$total'}
        }},
        {$sort: {_id: 1}}
        ])
    }

    async function getSalesByWeek(){
        const fourWeeksAgo = new Date()
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

        return await Order.aggregate([
            {$match: {createdAt: {$gte: fourWeeksAgo},
            status: {$nin: ['Failed' , 'Cancelled']}
        }},
        {$group:{
            _id: {$week: '$createdAt'},
            totalSales: {$sum: '$total'}
        }},
        {$sort: {_id: 1}}
        ])
    }

    async function getSalesByDay(){
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        return await Order.aggregate([
            {$match: {createdAt: {$gte: sevenDaysAgo},
            status: {$nin: ['Failed' , 'Cancelled']}
        }},
        {$group: {
            _id: {$dayOfWeek: '$createdAt'},
            totalSales: {$sum: '$total'}
        }},
        {$sort: {_id: 1}}
        ])
    }

         

    const logoutAdmin = async(req,res)=>{
        try {
          res.clearCookie('adminToken',{path:'/admin'})
          res.redirect('/admin/login')
        } catch (error) {
          console.log(error.message);
          res.status(500).send('Server error during logout');
        }
      }


    
  


module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logoutAdmin
}


