const {check,validationResult} = require('express-validator')

const brandValidation = [
    check('name').trim().notEmpty().withMessage('Brand name is required'),
    check('description').trim().notEmpty().withMessage('Description is required'),
    check('image').custom((value,{req}) => {

        if(!req.file){
            throw new Error('Image is required')
        }
        return true
    })
]

module.exports ={brandValidation}