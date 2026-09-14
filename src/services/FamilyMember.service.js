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

    async updateMember(memberId, data) {
        const member = await FamilyMember.findOneAndUpdate(
            { _id: memberId, isDeleted: false },
            { $set: data },
            { new: true, runValidators: true }
        );
        if (!member) throw new ApiError(404, 'Member not found');
        return member;
    }

    // Phase 2: Soft delete a subtree recursively
    async deleteSubtree(treeId, rootMemberId, deletedByUserId) {
        // const session = await mongoose.startSession();
        // session.startTransaction();
        try {
            // Find all relationships in this tree
            const relationships = await FamilyRelationship.find({ treeId });
            
            // Build adjacency list to easily find children
            const childrenMap = {};
            for (const rel of relationships) {
                if (!childrenMap[rel.parentMemberId]) {
                    childrenMap[rel.parentMemberId] = [];
                }
                childrenMap[rel.parentMemberId].push(rel.childMemberId);
            }

            // BFS or DFS to collect all descendants
            const nodesToDelete = new Set([rootMemberId]);
            const queue = [rootMemberId];

            while (queue.length > 0) {
                const current = queue.shift();
                const children = childrenMap[current] || [];
                for (const child of children) {
                    if (!nodesToDelete.has(child.toString())) {
                        nodesToDelete.add(child.toString());
                        queue.push(child.toString());
                    }
                }
            }

            // Soft delete all collected nodes
            const memberIds = Array.from(nodesToDelete);
            await FamilyMember.updateMany(
                { _id: { $in: memberIds }, treeId },
                { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: deletedByUserId } },
                {}
            );

            // await session.commitTransaction();
            // session.endSession();

            return { deletedCount: memberIds.length };
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            throw error;
        }
    }

    // Phase 7: Restore a soft-deleted subtree recursively
    async restoreSubtree(treeId, rootMemberId) {
        // const session = await mongoose.startSession();
        // session.startTransaction();
        try {
            // Find all relationships in this tree (even for deleted nodes)
            const relationships = await FamilyRelationship.find({ treeId });
            
            // Build adjacency list to easily find children
            const childrenMap = {};
            for (const rel of relationships) {
                if (!childrenMap[rel.parentMemberId]) {
                    childrenMap[rel.parentMemberId] = [];
                }
                childrenMap[rel.parentMemberId].push(rel.childMemberId);
            }

            // BFS to collect all descendants
            const nodesToRestore = new Set([rootMemberId]);
            const queue = [rootMemberId];

            while (queue.length > 0) {
                const current = queue.shift();
                const children = childrenMap[current] || [];
                for (const child of children) {
                    if (!nodesToRestore.has(child.toString())) {
                        nodesToRestore.add(child.toString());
                        queue.push(child.toString());
                    }
                }
            }

            // Restore all collected nodes
            const memberIds = Array.from(nodesToRestore);
            await FamilyMember.updateMany(
                { _id: { $in: memberIds }, treeId },
                { $set: { isDeleted: false }, $unset: { deletedAt: 1, deletedBy: 1 } },
                {}
            );

            // await session.commitTransaction();
            // session.endSession();

            return { restoredCount: memberIds.length, memberIds };
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            throw error;
        }
    }

    // Add a child node under a parent
    async addChild(treeId, parentMemberId, childData, createdBy) {
        // const session = await mongoose.startSession();
        // session.startTransaction();
        try {
            const parent = await FamilyMember.findOne({ _id: parentMemberId, treeId, isDeleted: false });
            if (!parent) throw new ApiError(404, 'Parent not found');

            // Handle marital status logic (SINGLE -> MARRIED)
            if (parent.maritalStatus === 'SINGLE') {
                parent.maritalStatus = 'MARRIED';
                await parent.save({});
            }

            // Create Child
            const child = new FamilyMember({
                ...childData,
                treeId
            });
            await child.save({});

            // Create Relationship
            const relationship = new FamilyRelationship({
                treeId,
                parentMemberId: parent._id,
                childMemberId: child._id,
                relationshipType: 'PARENT_CHILD'
            });
            await relationship.save({});

            // await session.commitTransaction();
            // session.endSession();

            return child;
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            throw error;
        }
    }

    async getTreeBranch(treeId, rootMemberId, depth = 3) {
        // Phase 8: Lazy Loading via Depth Limiting
        const relationships = await FamilyRelationship.find({ treeId }).lean();
        
        let actualRootId = rootMemberId;
        if (!actualRootId) {
            // Find root: member with no parents
            const allChildren = new Set(relationships.map(r => r.childMemberId.toString()));
            const potentialRootRel = relationships.find(r => !allChildren.has(r.parentMemberId.toString()));
            if (potentialRootRel) {
                actualRootId = potentialRootRel.parentMemberId;
            } else {
                // Fallback to any member
                const firstMember = await FamilyMember.findOne({ treeId, isDeleted: false }).lean();
                if (firstMember) actualRootId = firstMember._id;
            }
        }

        if (!actualRootId) {
            return { treeId, rootMemberId: null, members: [], relationships: [] };
        }

        const childrenMap = {};
        for (const rel of relationships) {
            const pId = rel.parentMemberId.toString();
            if (!childrenMap[pId]) childrenMap[pId] = [];
            childrenMap[pId].push(rel.childMemberId.toString());
        }

        const memberIdsToFetch = new Set([actualRootId.toString()]);
        let currentLevel = [actualRootId.toString()];
        let currentDepth = 0;

        // Ensure we load at least to the specified depth
        while (currentLevel.length > 0 && currentDepth < depth) {
            let nextLevel = [];
            for (const nodeId of currentLevel) {
                const children = childrenMap[nodeId] || [];
                for (const child of children) {
                    if (!memberIdsToFetch.has(child)) {
                        memberIdsToFetch.add(child);
                        nextLevel.push(child);
                    }
                }
            }
            currentLevel = nextLevel;
            currentDepth++;
        }

        // We still return all relationships so the frontend knows which nodes have hidden children, 
        // but we only fetch the member profiles for the allowed depth.
        const members = await FamilyMember.find({ 
            treeId, 
            _id: { $in: Array.from(memberIdsToFetch) },
            isDeleted: false 
        }).lean();

        return {
            treeId,
            rootMemberId: actualRootId,
            members,
            relationships
        };
    }
}

module.exports = new FamilyMemberService();
