const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({

    code:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    discountValue:{
        type:Number,
        required:true,
        min:1,
        max:85
    },
    minimumPurchase:{
        type:Number,
        required:true,
        min:0
    },
    description:{
        type:String,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    usageLimit:{
        type:Number,
        default:1,
        min:1
    },
    couponType: {
        type: String,
        enum: ['global', 'referral'],
        default: 'global'
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timeUsed:{
        type:Number,
        default:0
    },
    isActive:{
        type:Boolean,
        default:true
    }
},        { timestamps:true,
            toJSON:{virtuals:true},
            toObject:{virtuals:true}
        }
)



module.exports = mongoose.model('Coupon',couponSchema)