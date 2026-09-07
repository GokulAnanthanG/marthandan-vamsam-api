const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
    treeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyTree',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER'],
        required: true
    },
    photoUrl: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    whatsapp: {
        type: String,
        trim: true,
        default: null
    },
    residentialAddress: {
        type: String,
        trim: true,
        default: null
    },
    occupationType: {
        type: String,
        enum: ['JOB', 'BUSINESS', 'SERVICE', 'FARMER', 'OTHER', null],
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
    businessName: {
        type: String,
        trim: true,
        default: null
    },
    businessDetails: {
        type: String,
        trim: true,
        default: null
    },
    businessAddress: {
        type: String,
        trim: true,
        default: null
    },
    businessLatitude: {
        type: Number,
        default: null
    },
    businessLongitude: {
        type: Number,
        default: null
    },
    maritalStatus: {
        type: String,
        enum: ['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'],
        default: 'SINGLE'
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
