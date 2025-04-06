const {check,validationResult} = require('express-validator')

const categoryValidation = [
    check('name').notEmpty().withMessage('Category name is required'),
    check('description').notEmpty().withMessage('Description is required'),
    check('image').custom((value,{req}) => {

        if(!req.file){
            throw new Error('Image is required')
        }
        return true
    })
]

module.exports ={categoryValidation}