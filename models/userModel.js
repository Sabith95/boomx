const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobile:
    {type:String,
        default: null
    },
    password:{
        type:String,
        default:null
    },
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    
})

module.exports = mongoose.model('User',userSchema)