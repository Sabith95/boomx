const mongoose= require('mongoose')
const Counter = require('../models/counterModel')
const { strike } = require('pdfkit')

const orderSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    address:{
        name:{
            type:String,
            required:true
        },
        phone:{
            type:String,
            required:true
        },
        streetAddress:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        pinCode:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        }

    },
    items:{
            type:Array,
            required:true
        },
        paymentMethod:{
            type:String,
            enum:['cod','razorpay'],
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
        discount: {                
            type: Number,
            default: 0
        },
        coupon: {                 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon',
            default: null
        },
        status:{
            type:String,
            default:'Pending'
        },
        orderNumber:{
            type:String,
            unique:true
            
        },
        razorpayOrderId:{
            type:String
        },
        razorpayPaymentId:{
            type:String
        },
        razorpaySignature:{
            type:String
        },
        paymentStatus: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed'],
            default: 'Pending'
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