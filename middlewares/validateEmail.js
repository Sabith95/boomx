const {check,validationResult}= require('express-validator')

const validateEmail=[
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail()
]

module.exports={
    validateEmail
}