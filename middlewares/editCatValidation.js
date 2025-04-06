const {check,validationResult} = require('express-validator')

const editCatValidation = [
    check('name').notEmpty().withMessage('Category name is required'),
    check('description').notEmpty().withMessage('Description is required'),
    check('image').custom((value,{req}) => {

       
        return true
    })
]

module.exports ={editCatValidation}