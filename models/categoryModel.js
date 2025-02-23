const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema(
    {
    name:{
        type:String,
        required:true
    },
    description:String,
    isListed:{
        type:Boolean,
        default:true
    },
    image:{
        type:String,
        required:true
    }
},
    {   timestamps:true,
        toJSON:{virtuals:true},
        toObject:{virtuals:true}
    }
)

module.exports = mongoose.model('Category',categorySchema)



