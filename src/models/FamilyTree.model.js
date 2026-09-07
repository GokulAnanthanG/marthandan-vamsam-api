const mongoose = require('mongoose');

const familyTreeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: null
    },
    rootMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        default: null // Will be set after the first member is created
    },
    coverPhotoUrl: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FamilyTree', familyTreeSchema);
