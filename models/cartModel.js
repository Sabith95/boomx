const mongoose = require('mongoose')
const cartItemSchema= require('../models/cartItemModel')

const cartSchema= new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    items:[cartItemSchema],
    total:{
        type:Number,
        default:0
    }
},
    {timestamps:true}
)

cartSchema.pre('save', function (next) {
    this.total = this.items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    next();
  });
  
  // Method to manually recalculate total
  cartSchema.methods.calculateTotal = function () {
    this.total = this.items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    return this.total;
  };


module.exports=mongoose.model('Cart',cartSchema)