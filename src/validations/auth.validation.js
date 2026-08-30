const Joi = require('joi');

const registerValidation = Joi.object({
    fullName: Joi.string().required(),
    mobileNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
        'string.pattern.base': 'Mobile number must be valid'
    }),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match'
    }),
    dateOfBirth: Joi.date().iso().required(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').required(),
    otp: Joi.string().length(6).required(), // Development OTP: 123456
    
    // Optional fields
    whatsappNumber: Joi.string().pattern(/^[0-9]{10,15}$/).allow('', null),
    residentialAddress: Joi.string().allow('', null),
    businessAddress: Joi.string().allow('', null),
    occupation: Joi.string().allow('', null),
    businessName: Joi.string().allow('', null)
});

const loginValidation = Joi.object({
    mobileNumber: Joi.string().required(),
    otp: Joi.string().length(6).required() // Fixed dev OTP
});

const sendOtpValidation = Joi.object({
    mobileNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required()
});

module.exports = {
    registerValidation,
    loginValidation,
    sendOtpValidation
};
