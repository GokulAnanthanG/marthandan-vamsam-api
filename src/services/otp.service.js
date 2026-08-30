// Development OTP is fixed. Can be integrated with an SMS provider later.
const generateOTP = () => {
    // For development purposes, returning fixed OTP
    return '123456';
};

const sendOTP = async (mobileNumber, otp) => {
    // Mock sending OTP
    console.log(`Sending OTP ${otp} to ${mobileNumber}`);
    return true;
};

const verifyOTP = (inputOtp, expectedOtp = '123456') => {
    // In production, we would check a cache/DB like Redis
    return inputOtp === expectedOtp;
};

module.exports = {
    generateOTP,
    sendOTP,
    verifyOTP
};
