const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: Date,
        required: false
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER'],
        required: false
    },
    fatherName: {
        type: String,
        trim: true,
        default: null
    },
    fcmToken: {
        type: String,
        default: null
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    profilePhotoUrl: {
        type: String,
        default: null
    },
    profilePhotoKey: {
        type: String,
        default: null
    },
    whatsappNumber: {
        type: String,
        trim: true,
        default: null
    },
    residentialAddress: {
        type: String,
        trim: true,
        default: null
    },
    businessAddress: {
        type: String,
        trim: true,
        default: null
    },
    occupation: {
        type: String,
        trim: true,
        default: null
    },
    businessName: {
        type: String,
        trim: true,
        default: null
    },
    businessType: {
        type: String,
        trim: true,
        default: null
    },
    fieldOfWork: {
        type: String,
        trim: true,
        default: null
    },
    companyName: {
        type: String,
        trim: true,
        default: null
    },
    jobTitle: {
        type: String,
        trim: true,
        default: null
    },
    workAddress: {
        type: String,
        trim: true,
        default: null
    },
    profileType: {
        type: String,
        enum: ['GENERAL', 'BUSINESS', 'WORK', 'BOTH'],
        default: 'GENERAL'
    },
    role: {
        type: String,
        enum: ['ADMIN', 'SUB_ADMIN', 'NORMAL_USER', 'DATA_ENTRY'],
        default: 'NORMAL_USER'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'BLOCKED'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
