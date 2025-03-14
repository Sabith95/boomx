const category = require('../models/categoryModel');
// const { search } = require('../routes/adminRoutes');
const jwtHelper = require('../utils/jwtHelper');


const loadCategories = async (req, res) => {

    try {

      const token = req.cookies.adminToken;
      if (!token || !jwtHelper.verifyToken(token)) {
          return res.redirect('/admin/login');
      }

      const page =parseInt(req.query.page) || 1
      const limit = 5
      const skip = (page-1)*limit


      const querySearch = req.query.search ?req.query.search.trim():""
      const filter = {}
      if(querySearch){
        filter.name = {$regex :new RegExp(querySearch,"i")}
      }

      
        // Fetch all categories from the database so they can be displayed
        const categories = await category.find(filter).sort({createdAt:-1}).skip(skip).limit(limit)
        const totalItems = await category.countDocuments()
        const totalPages = await Math.ceil(totalItems / limit)

        res.render('admin/category', { categories,search:querySearch ,currentPage:page,totalPages});
    } catch (error) {
        console.log(error.message);
    }
};

const verifyCategory = async (req, res) => {
    try {

      const token = req.cookies.adminToken;
      if (!token || !jwtHelper.verifyToken(token)) {
          return res.status(401).json({ success: false, message: "Unauthorized access" });
      }

        const { name, description } = req.body;
        const existingCategory= await category.findOne({name})
        if(existingCategory){
           return  res.status(400).json({message:"Category already registered"})
        }
        let imagePath =''
        if(req.file){
          imagePath='/uploads/' + req.file.filename
        }
        const newCategory = new category({ name, description,image:imagePath });
        await newCategory.save();
        res.status(200).json({ success: true, message: "Category added successfully", category: newCategory });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Failed to add category" });
    }
};

const unlistCategory= async(req,res)=>{
  try{

    const token = req.cookies.adminToken;
    if (!token || !jwtHelper.verifyToken(token)) {
        return res.redirect('/admin/login');
    }

    const categoryId = req.params.id
    const updatedCategory = await category.findByIdAndUpdate(
        categoryId,
        {isListed:false},
        {new:true}
    )
    if(!updatedCategory){
        return res.status(400).json({success:false,message:"Category not found"})
    }
    res.redirect('/admin/category')

  }
  catch(error){
    res.status(500).json({success:false,message:"Failed to unlist category"})
  }
}


const listCategory = async(req,res)=>{
    try{

      const token = req.cookies.adminToken;
      if (!token || !jwtHelper.verifyToken(token)) {
          return res.redirect('/admin/login');
      }

        const categoryId =req.params.id
        const updatedCategory= await category.findByIdAndUpdate(
            categoryId,
            {isListed:true},
            {new:true}
        )
        if(!updatedCategory){
            return res.status(400).json({success:false,message:"Category not found"})
        }
        res.redirect('/admin/category')
    }
    catch(error){
        console.log(error)
        res.status(500).json({success:false,message:"Failed to list category"})
    }
}


const editCategory = async (req, res) => {

  const token = req.cookies.adminToken;
  if (!token || !jwtHelper.verifyToken(token)) {
      return res.status(401).json({ success: false, message: "Unauthorized access" });
  }
  
    const { id } = req.params;
    const { name, description } = req.body;
  
    // Verify that required fields are provided
    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Name and description are required' });
    }
  
    try {
      // Check for duplicate category name, ignoring the current category
      const duplicate = await category.findOne({ 
        name: name.trim(), 
        _id: { $ne: id } 
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'A category with that name already exists' });
      }
      
      const updateData ={
        name: name.trim() ,
        description:description.trim()
      }

      if(req.file){
        updateData.image = '/uploads/' + req.file.filename
      }


      // Update the category if no duplicate exists
      const updatedCategory = await category.findByIdAndUpdate(
        id,
        updateData,
        {new:true}
      );
  
      if (!updatedCategory) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        category: updatedCategory
      });
    } catch (error) {
      console.error('Error updating category:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };


module.exports = {
    loadCategories,
    verifyCategory,
    unlistCategory,
    listCategory,
    editCategory
};
