const mongoose = require('mongoose');

const familyHeadDetailSchema = new mongoose.Schema({
    treeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyTree',
        required: true
    },
    headMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        required: true
    },
    familyDescription: {
        type: String,
        trim: true,
        default: null
    },
    familyPhotoUrl: {
        type: String,
        default: null
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FamilyHeadDetail', familyHeadDetailSchema);
