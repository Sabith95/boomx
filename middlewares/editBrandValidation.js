const {check,validationResult} = require('express-validator')

const editBrandValidation = [
    check('name').notEmpty().withMessage('Brand name is required'),
    check('description').notEmpty().withMessage('Description is required'),
    check('image').custom((value,{req}) => {

       
        return true
    })
]

module.exports ={editBrandValidation}