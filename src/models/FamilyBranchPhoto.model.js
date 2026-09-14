const mongoose = require('mongoose');

const familyBranchPhotoSchema = new mongoose.Schema({
    rootMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        trim: true,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FamilyBranchPhoto', familyBranchPhotoSchema);
