const mongoose = require('mongoose');

const matrimonialProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        default: null
    },
    personName: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE'],
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    height: {
        type: String,
        trim: true,
        default: "5'6\""
    },
    education: {
        type: String,
        trim: true,
        default: ''
    },
    occupation: {
        type: String,
        trim: true,
        default: ''
    },
    fieldOfWork: {
        type: String,
        trim: true,
        default: ''
    },
    income: {
        type: String,
        trim: true,
        default: ''
    },
    residentialAddress: {
        type: String,
        trim: true,
        default: ''
    },
    fatherName: {
        type: String,
        trim: true,
        default: ''
    },
    motherName: {
        type: String,
        trim: true,
        default: ''
    },
    contactNumber: {
        type: String,
        trim: true,
        default: ''
    },
    // Req 5.4: Asset and Document Management
    bridePhotoUrl: {
        type: String,
        default: null
    },
    groomPhotoUrl: {
        type: String,
        default: null
    },
    jathagamUrl: {
        type: String,
        default: null
    },
    biodataUrl: {
        type: String,
        default: null
    },
    about: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'MARRIED'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MatrimonialProfile', matrimonialProfileSchema);
