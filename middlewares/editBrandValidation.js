const {check,validationResult} = require('express-validator')

const editBrandValidation = [
    check('name').trim().notEmpty().withMessage('Brand name is required'),
    check('description').trim().notEmpty().withMessage('Description is required'),
    check('image').custom((value,{req}) => {

       
        return true
    })
]

module.exports ={editBrandValidation}