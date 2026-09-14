const FamilyRelationship = require('../models/FamilyRelationship.model');
const FamilyMember = require('../models/FamilyMember.model');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

class FamilyRelationshipService {
    // Phase 2: Move Subtree
    async moveSubtree(treeId, subtreeRootId, newParentId) {
        // const session = await mongoose.startSession();
        // session.startTransaction();
        try {
            // Validate nodes
            const subtreeRoot = await FamilyMember.findOne({ _id: subtreeRootId, treeId, isDeleted: false });
            const newParent = await FamilyMember.findOne({ _id: newParentId, treeId, isDeleted: false });

            if (!subtreeRoot || !newParent) {
                throw new ApiError(404, 'Node not found');
            }

            if (subtreeRootId === newParentId) {
                throw new ApiError(400, 'Cannot move a node under itself');
            }

            // Find existing relationship where subtreeRoot is the child
            const existingRel = await FamilyRelationship.findOne({ 
                treeId, 
                childMemberId: subtreeRootId 
            });

            if (existingRel) {
                // If it already has a parent, remove the old relationship
                await FamilyRelationship.findByIdAndDelete(existingRel._id);
            }

            // Create new relationship
            const newRel = new FamilyRelationship({
                treeId,
                parentMemberId: newParentId,
                childMemberId: subtreeRootId,
                relationshipType: 'PARENT_CHILD'
            });

            await newRel.save({});

            // await session.commitTransaction();
            // session.endSession();
            
            return newRel;
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            throw error;
        }
    }

    // Phase 2: Insert Node Between two existing nodes
    async insertBetween(treeId, parentId, childId, newMemberData) {
        // const session = await mongoose.startSession();
        // session.startTransaction();
        try {
            // Find existing relationship
            const existingRel = await FamilyRelationship.findOne({
                treeId,
                parentMemberId: parentId,
                childMemberId: childId
            });

            if (!existingRel) {
                throw new ApiError(404, 'Relationship between specified nodes does not exist');
            }

            // Create the new member
            const newMember = new FamilyMember({
                ...newMemberData,
                treeId
            });
            await newMember.save({});

            // Delete old relationship
            await FamilyRelationship.findByIdAndDelete(existingRel._id);

            // Create Relationship: Parent -> New Member
            const rel1 = new FamilyRelationship({
                treeId,
                parentMemberId: parentId,
                childMemberId: newMember._id,
                relationshipType: 'PARENT_CHILD'
            });
            await rel1.save({});

            // Create Relationship: New Member -> Child
            const rel2 = new FamilyRelationship({
                treeId,
                parentMemberId: newMember._id,
                childMemberId: childId,
                relationshipType: 'PARENT_CHILD'
            });
            await rel2.save({});

            // await session.commitTransaction();
            // session.endSession();

            return newMember;
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            throw error;
        }
    }
}

module.exports = new FamilyRelationshipService();
