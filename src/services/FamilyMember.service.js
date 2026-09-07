const FamilyMember = require('../models/FamilyMember.model');
const FamilyRelationship = require('../models/FamilyRelationship.model');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

class FamilyMemberService {
    async createMember(treeId, data, createdBy) {
        const member = new FamilyMember({
            ...data,
            treeId
        });
        await member.save();
        return member;
    }

    async getMemberById(memberId) {
        const member = await FamilyMember.findOne({ _id: memberId, isDeleted: false });
        if (!member) throw new ApiError(404, 'Member not found');
        return member;
    }

    // Add a child node under a parent
    async addChild(treeId, parentMemberId, childData, createdBy) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const parent = await FamilyMember.findOne({ _id: parentMemberId, treeId, isDeleted: false }).session(session);
            if (!parent) throw new ApiError(404, 'Parent not found');

            // Handle marital status logic (SINGLE -> MARRIED)
            if (parent.maritalStatus === 'SINGLE') {
                parent.maritalStatus = 'MARRIED';
                await parent.save({ session });
            }

            // Create Child
            const child = new FamilyMember({
                ...childData,
                treeId
            });
            await child.save({ session });

            // Create Relationship
            const relationship = new FamilyRelationship({
                treeId,
                parentMemberId: parent._id,
                childMemberId: child._id,
                relationshipType: 'PARENT_CHILD'
            });
            await relationship.save({ session });

            await session.commitTransaction();
            session.endSession();

            return child;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }

    async getTreeBranch(treeId, rootMemberId, depth = 3) {
        // Simple implementation to fetch members and relationships for a tree
        // In a real scenario, this would use recursive queries or multiple queries to fetch up to a certain depth.
        // For now, we fetch all active members and relationships for the tree to build the tree on the client side.
        
        const members = await FamilyMember.find({ treeId, isDeleted: false }).lean();
        const relationships = await FamilyRelationship.find({ treeId }).lean();
        
        return {
            treeId,
            rootMemberId,
            members,
            relationships
        };
    }
}

module.exports = new FamilyMemberService();
