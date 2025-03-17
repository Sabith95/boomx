const {check,validationResult}= require('express-validator')

const validateEmail=[
    check('eamil')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
]

module.exports={
    validateEmail
}