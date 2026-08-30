const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { registerValidation, loginValidation, sendOtpValidation } = require('../validations/auth.validation');

const router = express.Router();

router.post('/send-otp', validate(sendOtpValidation), authController.sendOtp);
router.post('/register', validate(registerValidation), authController.register);
router.post('/login', validate(loginValidation), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
