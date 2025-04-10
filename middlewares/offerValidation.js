const {body,validationResult} = require('express-validator')

const offerValidation = [
    body('name')
    .trim()
    .notEmpty()
    .withMessage('Offer name is required'),

    body('offerType')
    .notEmpty()
    .withMessage('offer type is required')
    .isIn(['product','category'])
    .withMessage('Offer type must be product or category'),

    body('productId')
    .if(body('offerType').equals('product'))
    .notEmpty()
    .withMessage('Product selection is required for product offers'),

    body('categoryId')
    .if(body('offerType').equals('category'))
    .notEmpty()
    .withMessage('Category selection is required for category offers'),

    body('discountPercentage')
    .notEmpty()
    .withMessage('Discount percentage is required')
    .isFloat({ min: 1, max: 85 })
    .withMessage('Discount percentage must be between 1 and 85'),

    body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom(value =>{
        const inputDate = new Date(value)
        if(inputDate <= new Date()){
            throw new Error ('End date must be in the future')
        }
        return true
    })
]

module.exports = {offerValidation}