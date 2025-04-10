const {check,validationResult} = require('express-validator')

const productValidation =[
    check('name').trim().notEmpty().withMessage('Product name is required'),

    check('brand').notEmpty().withMessage('Brand is required'),

    check('description').trim().notEmpty().withMessage('Description is required'),

    check('regularPrice')
        .notEmpty().withMessage('Regular price is required')
        .isNumeric().withMessage('Regular price must be a valid number'),

    check('salePrice')
        .notEmpty().withMessage('Sale price is required')
        .isNumeric().withMessage('Sale price must be a valid number'),

    check('quantity')
        .notEmpty().withMessage('Quantity is required'),
        

    check('category').notEmpty().withMessage('Category is required')    
    

]

module.exports={productValidation}