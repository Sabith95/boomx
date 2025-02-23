const brand = require('../models/brandModel')

const loadBrands = async(req,res)=>{
    try {

        const brands = await brand.find()
        res.render('admin/brand',{brands})
    } catch (error) {
        console.log(error.message)
    }
}

const verifyBrand = async(req,res)=>{
    try {
        const {name,description} = req.body
        const existingBrand = await brand.findOne({name})
        if(existingBrand){
           return res.status(400).json({message:"Brand already registered"})
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

const unlistBrand = async(req,res)=>{
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
module.exports= {
    loadBrands,
    verifyBrand,
    unlistBrand,
    listBrand
}