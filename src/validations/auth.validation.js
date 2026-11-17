const Joi = require('joi');

const registerValidation = Joi.object({
    fullName: Joi.string().required(),
    fatherName: Joi.string().required(),
    mobileNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
        'string.pattern.base': 'Mobile number must be valid'
    }),
    residentialAddress: Joi.string().required(),
    otp: Joi.string().length(6).required(), // Development OTP: 123456
    
    // Optional fields
    whatsappNumber: Joi.string().pattern(/^[0-9]{10,15}$/).allow('', null),
    businessAddress: Joi.string().allow('', null),
    occupation: Joi.string().allow('', null),
    businessName: Joi.string().allow('', null),
    fcmToken: Joi.string().allow('', null)
});

const loginValidation = Joi.object({
    mobileNumber: Joi.string().required(),
    otp: Joi.string().length(6).required(), // Fixed dev OTP
    fcmToken: Joi.string().allow('', null)
});

const sendOtpValidation = Joi.object({
    mobileNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required()
});

module.exports = {
    registerValidation,
    loginValidation,
    sendOtpValidation
};
