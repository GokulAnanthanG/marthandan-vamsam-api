const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
    houseName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    headName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    residentialAddress: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        trim: true,
        default: 'Marthandan'
    },
    state: {
        type: String,
        trim: true,
        default: 'Tamil Nadu'
    },
    pincode: {
        type: String,
        trim: true,
        default: ''
    },
    contactNumber: {
        type: String,
        trim: true,
        default: ''
    },
    familyMembersCount: {
        type: Number,
        default: 4
    },
    generation: {
        type: String,
        trim: true,
        default: 'Heritage Lineage'
    },
    photoUrl: {
        type: String,
        default: null
    },
    treeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FamilyTree',
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('House', houseSchema);
