const { body, validationResult } = require('express-validator');

const validateAddress = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required').bail(),

  body('phone')
    .trim()
    .notEmpty().withMessage("Phone number is required").bail()
    .isLength({ min: 10, max: 10 }).withMessage("Phone number must be exactly 10 digits").bail()
    .matches(/^\d+$/).withMessage("Phone number must contain only numbers").bail(),

  body('streetAddress')
    .trim()
    .notEmpty().withMessage('Street address is required.').bail(),

  body('city')
    .trim()
    .notEmpty().withMessage('City is required.').bail(),

  body('state')
    .trim()
    .notEmpty().withMessage('State is required.').bail(),

    body('pinCode')
    .trim()
    .notEmpty().withMessage('PIN code is required.').bail()
    .isLength({ min: 6, max: 6 }).withMessage('PIN code must be exactly 6 digits.').bail()
    .matches(/^\d+$/).withMessage('PIN code must contain only numbers.').bail(),
  

  body('country')
    .trim()
    .notEmpty().withMessage('Country is required.').bail(),

  body('addressType')
    .trim()
    .notEmpty().withMessage('Address type is required.').bail()
    .isIn(['Home', 'Office', 'Other']).withMessage('Invalid address type.').bail()
];

module.exports = {
  validateAddress
};
