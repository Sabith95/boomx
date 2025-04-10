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

    
   // Helper functions should be defined in the same file or imported from another module

async function getSalesByYear() {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  return await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: fiveYearsAgo },
        status: { $nin: ['Failed', 'Cancelled'] }
      }
    },
    {
      $group: {
        _id: { $year: '$createdAt' },
        totalSales: { $sum: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

async function getSalesByMonth(year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  return await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $nin: ['Failed', 'Cancelled'] }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalSales: { $sum: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}

// Server-side changes first - getSalesByWeek function to modify in your controller
async function getSalesByWeek() {
  // Get date for last 4 weeks (or 2 weeks before current month + current month)
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Start from beginning of current month
  const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
  
  // Go back 2 weeks from start of current month
  const twoWeeksBeforeCurrentMonth = new Date(startOfCurrentMonth);
  twoWeeksBeforeCurrentMonth.setDate(twoWeeksBeforeCurrentMonth.getDate() - 14);
  
  return await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: twoWeeksBeforeCurrentMonth },
        status: { $nin: ['Failed', 'Cancelled'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          week: { $week: "$createdAt" }
        },
        minDate: { $min: "$createdAt" },
        maxDate: { $max: "$createdAt" },
        totalSales: { $sum: '$total' }
      }
    },
    { $sort: { 'minDate': 1 } }
  ]);
}



async function getSalesByDay() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo },
        status: { $nin: ['Failed', 'Cancelled'] }
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: '$createdAt' },
        totalSales: { $sum: '$total' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
}


const loadDashboard = async (req, res) => {
  try {
    const token = req.cookies.adminToken;
    if (!token) {
      return res.redirect('/admin/login');
    }
    const decoded = jwtHelper.verifyToken(token);
    if (!decoded) {
      return res.redirect('/admin/login');
    }

    const totalSales = await Order.aggregate([
      { $match: { status: { $nin: ['Failed', 'Cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const totalOrders = await Order.countDocuments({ status: { $nin: ['Failed', 'Cancelled'] } });
    const totalCustomers = await User.countDocuments({ isListed: true });
    const avgOrderValue = totalSales.length > 0 && totalOrders > 0 ? (totalSales[0].total / totalOrders).toFixed(2) : 0;

    const salesIncrease = 8.2;
    const ordersIncrease = 5.3;
    const customersIncrease = 12.1;
    const aovIncrease = 3.7;

    // Your existing aggregations for topProducts, topCategories, and topBrands here...
    const topProducts = await Order.aggregate([
      { $match: { status: { $nin: ['Failed', 'Cancelled'] } } },
      { $unwind: '$items' },
      { $group: {
          _id: '$items.product._id', 
          name: { $first: '$items.product.name' },
          totalSales: { $sum: { $multiply: ['$items.priceAddition', '$items.quantity'] } },
          totalQuantity: { $sum: '$items.quantity' }
      }},
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);
    
    const topCategories = await Order.aggregate([
      { $match: { status: { $nin: ['Failed', 'Cancelled'] } } },
      { $unwind: '$items' },
      { $lookup: {
          from: 'categories',
          let: { categoryId: { $toObjectId: '$items.product.category' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } }],
          as: 'categoryDetails'
      }},
      { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: '$items.product.category',
          name: { $first: { $ifNull: ['$categoryDetails.name', 'Unknown Category'] } },
          totalSales: { $sum: { $multiply: ['$items.priceAddition', '$items.quantity'] } }
      }},
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);
    
    const topBrands = await Order.aggregate([
      { $match: { status: { $nin: ['Failed', 'Cancelled'] } } },
      { $unwind: '$items' },
      { $lookup: {
          from: 'brands',
          let: { brandId: { $toObjectId: '$items.product.brand' } },
          pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$brandId'] } } }],
          as: 'brandDetails'
      }},
      { $unwind: { path: '$brandDetails', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: '$items.product.brand',
          name: { $first: { $ifNull: ['$brandDetails.name', 'Unknown Brand'] } },
          totalSales: { $sum: { $multiply: ['$items.priceAddition', '$items.quantity'] } }
      }},
      { $sort: { totalSales: -1 } },
      { $limit: 10 }
    ]);
    

    // Define time boundaries for filtered data
    const now = new Date();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Helper function for top products within a date range
    async function getTopProducts(filterStart, filterEnd) {
      return await Order.aggregate([
        {
          $match: {
            status: { $nin: ['Failed', 'Cancelled'] },
            createdAt: { $gte: filterStart, $lte: filterEnd }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product._id',
            name: { $first: '$items.product.name' },
            totalSales: { $sum: { $multiply: ['$items.priceAddition', '$items.quantity'] } },
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
      ]);
    }

    // Similarly, helper functions for topCategories and topBrands
    async function getTopCategories(filterStart, filterEnd) {
      return await Order.aggregate([
        {
          $match: {
            status: { $nin: ['Failed', 'Cancelled'] },
            createdAt: { $gte: filterStart, $lte: filterEnd }
          }
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'categories',
            let: { categoryId: { $toObjectId: '$items.product.category' } },
            pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$categoryId'] } } }],
            as: 'categoryDetails'
          }
        },
        {
          $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true }
        },
        {
          $group: {
            _id: '$items.product.category',
            name: { $first: { $ifNull: ['$categoryDetails.name', 'Unknown Category'] } },
            totalSales: { $sum: { $multiply: ['$items.priceAddition', '$items.quantity'] } }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
      ]);
    }

    async function getTopBrands(filterStart, filterEnd) {
      return await Order.aggregate([
        {
          $match: {
            status: { $nin: ['Failed', 'Cancelled'] },
            createdAt: { $gte: filterStart, $lte: filterEnd }
          }
        },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'brands',
            let: { brandId: { $toObjectId: '$items.product.brand' } },
            pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$brandId'] } } }],
            as: 'brandDetails'
          }
        },
        {
          $unwind: { path: '$brandDetails', preserveNullAndEmptyArrays: true }
        },
        {
          $group: {
            _id: '$items.product.brand',
            name: { $first: { $ifNull: ['$brandDetails.name', 'Unknown Brand'] } },
            totalSales: { $sum: { $multiply: ['$items.priceAddition', '$items.quantity'] } }
          }
        },
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
      ]);
    }

    // Get top charts for each filter period:
    const topProductsYearly = await getTopProducts(fiveYearsAgo, now);
    const topProductsMonthly = await getTopProducts(startOfYear, endOfYear);
    const topProductsWeekly = await getTopProducts(fourWeeksAgo, now);
    const topProductsDaily = await getTopProducts(sevenDaysAgo, now);

    const topCategoriesYearly = await getTopCategories(fiveYearsAgo, now);
    const topCategoriesMonthly = await getTopCategories(startOfYear, endOfYear);
    const topCategoriesWeekly = await getTopCategories(fourWeeksAgo, now);
    const topCategoriesDaily = await getTopCategories(sevenDaysAgo, now);

    const topBrandsYearly = await getTopBrands(fiveYearsAgo, now);
    const topBrandsMonthly = await getTopBrands(startOfYear, endOfYear);
    const topBrandsWeekly = await getTopBrands(fourWeeksAgo, now);
    const topBrandsDaily = await getTopBrands(sevenDaysAgo, now);

    const currentYear = new Date().getFullYear();
    const salesByYear = await getSalesByYear();
    const salesByMonth = await getSalesByMonth(currentYear);
    const salesByWeek = await getSalesByWeek();
    const salesByDay = await getSalesByDay();

    res.render("admin/dashboard", {
      totalSales,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      salesIncrease,
      ordersIncrease,
      customersIncrease,
      aovIncrease,
      // include your original top products, etc. if needed
      topProducts,
      topCategories,
      topBrands,
      // New filter-specific datasets:
      topProductsYearly,
      topProductsMonthly,
      topProductsWeekly,
      topProductsDaily,
      topCategoriesYearly,
      topCategoriesMonthly,
      topCategoriesWeekly,
      topCategoriesDaily,
      topBrandsYearly,
      topBrandsMonthly,
      topBrandsWeekly,
      topBrandsDaily,
      salesByYear,
      salesByMonth,
      salesByWeek,
      salesByDay
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Server error');
  }
};

    

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


