const mongoose = require('mongoose')
const {v4:uuidv4} = require('uuid')

const adminWalletSchema = new mongoose.Schema({
     user :{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    transactionId:{
        type:String,
        default:() => uuidv4(),
        unique:true
    },
    transactionType:{
        type:String,
        enum:['credit','debit','cancellation','refund'],
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    transactionDate:{
        type:Date,
        default:Date.now()
    },
    source:{
        type:String
    },
    order:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Order',
        required:true
    },
    admin:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Admin',
        required:true
    }
},
    {timestamps:true}
)

module.exports = mongoose.model('AdminWallet',adminWalletSchema)