const User = require('../models/userModel')
const Address = require('../models/addressModel')
const { search } = require('../routes/adminRoutes')

const loadAccount =async(req,res)=>{
    try {
        const activeTab=req.query.tab ? req.query.tab.trim() :'profile'
        const id= req.params.id
        const user=await User.findById(id)
        .populate('addresses')
        
        const defaultAddress = user.addresses.find(address => address.isDefault)


         const querySearch = req.query.search ? req.query.search.trim():""
                const filter={}
                if(querySearch){
                    filter.name ={$regex : new RegExp(querySearch,"i")}
                }

        res.render('user/userProfile',{user,activeTab,search:querySearch,defaultAddress})
    } catch (error) {
        console.error(error);
        
    }
    
}

const loadEditProfile = async(req,res)=>{
    try {
        const id = req.params.id
        const user= await User.findById(id)

        const querySearch= req.query.search ? req.query.search.trim():''
        const filter={}
        if(querySearch){
            filter.name ={$regex : new RegExp(querySearch,"i")}
        }
        
        res.render('user/editProfile',{user,search:querySearch})
    } catch (error) {
        console.error(error);
        
        
    }
}

const editProfile = async(req,res)=>{
    try {
        const id = req.params.id
        const {name,email,mobile} = req.body

       if(!name || !mobile){
        return res.status(400).json({success:false,message:"Misssing required fields"})
       }
       const updateData={
        name:name.trim(),
        mobile:mobile.trim()
       }
       if(req.file){
        updateData.image='/uploads/' + req.file.filename
       }

       const updatedUser= await User.findByIdAndUpdate(
        id,
        updateData,
        {new:true}
       )
       if(!updatedUser){
        return res.status(404).json({success:false,message:'User not found'})
       }

       return res.status(200).json({
        success:true,
        message:'User updated successfully',
        user:updatedUser
       })
    } catch (error) {
        console.error('Error updating user:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}



module.exports={
    loadAccount,
    loadEditProfile,
    editProfile
}