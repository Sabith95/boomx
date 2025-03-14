const mongoose = require('mongoose')
const addressSchema=new mongoose.Schema({
    name:{

        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    streetAddress:{ 
        type: String, 
        required: true 
    },
    city: { 
        type: String, 
        required: true 
    },
    state: { 
        type: String,
         required: true 
        },
    pinCode: { 
        type: String, 
        required: true 
    },
    country: { 
        type: String, 
        required: true 
    },
    addressType: { 
      type: String, 
      enum: ['Home', 'Office', 'Other'], 
      default: 'Home' 
    },
    isDefault: { 
        type: Boolean,
         default: false 
        }
  }, 
  { 
    timestamps: true 

})

module.exports=mongoose.model('Address',addressSchema)