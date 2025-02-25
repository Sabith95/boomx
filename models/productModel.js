const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand:{
        type:mongoose.Schema.Types.ObjectId,ref:'brand',
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,ref:'Category',
        required:true
    },
    regularPrice: { 
        type: Number, 
        required: true 
    },
    salePrice: { 
        type: Number 
    },
    quantity: { 
        type: Number,
         required: true 
     },
     image  : {  
        type: [String], 
        required: [true] 
     },
    isListed:{
        type:Boolean,
        default:true
    },

},
{   timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
}

)

module.exports = mongoose.model('product',productSchema)