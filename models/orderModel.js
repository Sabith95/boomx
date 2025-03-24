const mongoose= require('mongoose')
const Counter = require('../models/counterModel')

const orderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    address:{
        type:Object,
        required:true
    },
    userName: {
        type: String,
        required: true
      },
    items:{
            type:Array,
            required:true
        },
        paymentMethod:{
            type:String,
            enum:['cod'],
            required:true
        },
        subtotal:{
            type:Number,
            required:true
        },
        tax:{
            type:Number,
            required:true
        },
        total:{
            type:Number,
            required:true
        },
        status:{
            type:String,
            default:'Pending'
        },
        orderNumber:{
            type:String,
            unique:true
            
        },
        returnRequest: {
            requested: {
              type: Boolean,
              default: false
            },
            requestDate: {
              type: Date
            },
            refundAmount: {
                type: Number
             },
            returnReason: {
              type: String
            },
            returnStatus: {
              type: String,
              enum: ['Pending', 'Approved', 'Rejected'],
              default: 'Pending'
            }
          }
    },
    {timestamps:true})

    orderSchema.pre('save', async function(next){

        if(!this.orderNumber){
            try {
                
                const counter = await Counter.findOneAndUpdate(
                    {_id:'orderNumber'},
                    {$inc:{seq:1}},
                    {new:true,upsert:true}
                )

                this.orderNumber = 'ORD-' + counter.seq.toString().padStart(6,'0')
                next()
            } catch (error) {
                next(error)
            }
        }
        else{
            next()
        }
    })
    module.exports = mongoose.model('Order',orderSchema)