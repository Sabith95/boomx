const mongoose = require('mongoose')
const cartItemSchema= require('../models/cartItemModel')

const cartSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    items:[cartItemSchema],
   
    discount:{
        type:Number,
        default:0
    }
    
},
    {timestamps:true}
)




module.exports=mongoose.model('Cart',cartSchema)