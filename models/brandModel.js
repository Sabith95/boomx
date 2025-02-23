const mongoose = require('mongoose')
const brandSchema =new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    isListed:{
        type:Boolean,
        default:true
    },
    image:{
        type:String,
        required:true
    }
},
   {
    timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
   }

)

module.exports = mongoose.model('brand',brandSchema)
