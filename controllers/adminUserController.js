const user = require('../models/userModel')
const jwtHelper = require('../utils/jwtHelper');


const loadUser = async (req,res)=>{
    try {

        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.redirect('/admin/login');
        }

        const page= parseInt(req.query.page || 1)
        const limit=5
        const skip=(page-1)*limit

        const querySearch=req.query.search?req.query.search.trim():""
        const filter={}
        if(querySearch){
            filter.name={$regex : new RegExp(querySearch,"i")}
        }
        const users = await user.find(filter).sort({createdAt:-1}).skip(skip).limit(limit)

        const totalDocuments=await user.countDocuments()
        const totalPages=await Math.ceil(totalDocuments/limit)
        res.render('admin/customers',{users,search:querySearch,currentPage:page,totalPages})
    } catch (error) {
        console.log(error.message)
    }
}

const updateStatus = async (req,res)=>{
    try {

        const token = req.cookies.adminToken;
        if (!token || !jwtHelper.verifyToken(token)) {
            return res.status(401).json({ success: false, message: "Unauthorized access" });
        }

        const userId = req.params.id
        const{action} = req.body    
        
        const update=(action === "block")?{isListed:false}:{isListed:true}
        const updatedData = await user.findByIdAndUpdate(userId,update,{new:true})
        if(!updatedData){
            return res.status(400).json({success:false,message:"User not found"})
        }
        return res.status(200).json({success:true,message:"User status updated"})
    } catch (error) {
        console.log(error.message)
        res.status(500).json({success:false,message:"Failed to update user status"})
    }
}

module.exports={
    loadUser,
    updateStatus
}