const {body,validationResult} = require('express-validator')

const validateInfo=[
    body('name')
    .trim()
    .notEmpty().withMessage('Full name is required').bail(),

     body('mobile')
        .trim()
        .notEmpty().withMessage("Phone number is required").bail()
        .isLength({ min: 10, max: 10 }).withMessage("Phone number must be exactly 10 digits").bail()
        .matches(/^\d+$/).withMessage("Phone number must contain only numbers").bail()

]

module.exports={
    validateInfo
}