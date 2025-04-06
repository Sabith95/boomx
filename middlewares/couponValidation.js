const {body,validationResult} = require('express-validator')

const couponValidation =[

    body('code')
    .trim()
    .notEmpty()
    .withMessage('Coupon code is required'),

    body('description')
    .notEmpty()
    .withMessage('Add a description'),

    body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({min:0, max:100})
    .withMessage('Discount value must be between 0 to 100'),

    body('minimumPurchase')
    .notEmpty()
    .withMessage('Minimum purchase amount is required')
    .isFloat({min:0})
    .withMessage('Minimum purchase must be positive number'),

    body('expiryDate')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Expiry date must be a valid date')
    .custom(value =>{
        const inputDate = new Date(value)
        if(inputDate <= new Date()){
            throw new Error ('Expiry date must be in the future')
        }
        return true
    })
]

module.exports={couponValidation}