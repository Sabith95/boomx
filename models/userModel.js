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
    referralCode: { 
        type: String, 
        unique: true,
        sparse:true 
    },
    referredBy: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'User' 
        },
        userId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
    mobile:
    {type:String,
        default: null
    },
    password:{
        type:String,
        default:null
    },
    image:{
        type:String,
       default:null
    },
    googleId: { 
        type: String, 
        unique: true, 
        sparse: true 
    },
    isListed:{
        type:Boolean,
        default:true
    },
    addresses:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Address'
    }]
    
},
  { timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
}
)

module.exports = mongoose.model('User',userSchema)