const brand = require('../models/brandModel')
const jwtHelper = require('../utils/jwtHelper');
const {validationResult} = require('express-validator')

const loadBrands = async(req,res)=>{
    try {

        const token = req.cookies.adminToken;
              if (!token || !jwtHelper.verifyToken(token)) {
                  return res.redirect('/admin/login');
              }

        const page = parseInt(req.query.page) || 1
        const limit = 5
        const skip = (page -1) *limit

        const querySearch = req.query.search ? req.query.search.trim():""
        const filter={}
        if(querySearch){
            filter.name={$regex :new RegExp(querySearch,"i")}
        }


        const brands = await brand.find(filter).sort({createdAt:-1}).skip(skip).limit(limit)
        const totalDocuments = await brand.countDocuments()
        const totalPages = await Math.ceil(totalDocuments / limit) 


        res.render('admin/brand',{brands,search:querySearch,currentPage:page,totalPages})
     
    } catch (error) {
        console.log(error.message)
    }
}

const verifyBrand = async(req,res)=>{
    try {

         const error = validationResult(req);
                    if (!error.isEmpty()) {
                        return res.status(400).json({
                        success: false,
                        error: error.array() 
                        });
                    }

        const {name,description} = req.body

        if(/^\d+$/.test(name)){
            return res.status(400).json({
                success:false,
                error:[{path:'name',msg:'Brand cannot be numbers only'}]
            })
        }

        const existingBrand = await brand.findOne({
            name:{$regex: new RegExp('^' + name + '$','i')}
        })
        if(existingBrand){
           return res.status(400).json({
            success:false,
            error:[{path:'name',msg:"Brand already registered"}]
        })
        }



        let imagePath = ''
        if(req.file){
            imagePath='/uploads/' + req.file.filename
        }

        const newBrand = new brand({name,description,image:imagePath})
        await newBrand.save()
        res.status(200).json({success:true,message:"Brand added successfully",brand:newBrand})
    } catch (error) {
        res.status(500).json({success:false,message:"Failed to add brand"})
    }
}

const   unlistBrand = async(req,res)=>{
    try {
        const brandId = req.params.id
        const updatedBrand = await brand.findByIdAndUpdate(
            brandId,
            {isListed:false},
            {new:true}
        )
        if(!updatedBrand){
            return res.status(400).json({success:false,message:"Brand not found"})   
        }
        res.redirect('/admin/brands')
    } catch (error) {
        res.status(500).json({success:false,message:"Something went wrong"})
    }
}

const listBrand = async(req,res)=>{
    try {
     const brandId =req.params.id
    const updatedBrand = await brand.findByIdAndUpdate(
        brandId,
        {isListed:true},
        {new:true}
    )
    if(!updatedBrand){
        return res.status(400).json({success:false,message:"Brand not found"})
    }
    res.redirect('/admin/brands')
    } catch (error) {
        res.status(500).json("Something went wrong")
    }
    
}

//editing brand

const loadEdit = async(req,res)=>{
    try {
        const brandToEdit = await brand.findById(req.params.id)
        if(!brandToEdit){
            return res.status(404).send("Brand not found")
        }
        res.render('admin/editBrand', { brand: brandToEdit });
    } catch (error) {
        console.log(error.message);
        res.status(500).send("An error occurred");
    }
   
}

const editBrand  = async (req,res)=>{
    try {

        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
            success: false,
            error: error.array() 
            });
        }
        
        const {id} = req.params
        const {name,description} = req.body

        if(!name || !description){
            return res.status(400).json({success:false,message:"Name and Descriptions are required"})
        }
        if(/^\d+$/.test(name)){
            return res.status(400).json({
                success:false,
                error:[{path:'name',msg:'Brand cannot be numbers only'}]
            })
        }
        const duplicate = await brand.findOne({
            name:name.trim(),
            _id:{$ne:id}
        })

        console.log('duplicate',duplicate);
        
        if(duplicate){
          return  res.status(400).json({success:false,
            error:[{path:'name',msg:"Brand already registered"}]
          })
        }
        const updateData={
            name:name.trim(),
            description:description.trim()
        }
        if(req.file){
            updateData.image ='/uploads/' + req.file.filename
        }
        const updatedBrand = await brand.findByIdAndUpdate(
            id,
            updateData,
            {new:true}
        )
        if(!updatedBrand){
           return res.status(400).json({success:false,message:"Brand not found"})
        }
        return res.status(200).json({success:true,message:"Brand updated",brand:updatedBrand})
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({ success: false, message: "Something went wrong" });

    }
}

module.exports= {
    loadBrands,
    verifyBrand,
    unlistBrand,
    listBrand,
    loadEdit,
    editBrand
}