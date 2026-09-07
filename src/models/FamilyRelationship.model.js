const mongoose = require('mongoose');

const familyRelationshipSchema = new mongoose.Schema({
    treeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyTree',
        required: true
    },
    parentMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        required: true
    },
    childMemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyMember',
        required: true
    },
    relationshipType: {
        type: String,
        enum: ['PARENT_CHILD'],
        default: 'PARENT_CHILD'
    }
}, {
    timestamps: true
});

// Recommended uniqueness
familyRelationshipSchema.index({ treeId: 1, parentMemberId: 1, childMemberId: 1 }, { unique: true });

module.exports = mongoose.model('FamilyRelationship', familyRelationshipSchema);
