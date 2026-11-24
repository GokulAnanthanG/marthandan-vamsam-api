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

    async addSpouse(treeId, memberId, spouseData, createdBy) {
        try {
            const member = await FamilyMember.findOne({ _id: memberId, treeId, isDeleted: false });
            if (!member) throw new ApiError(404, 'Member not found');

            if (member.maritalStatus === 'SINGLE') {
                member.maritalStatus = 'MARRIED';
                await member.save({});
            }

            // Create Spouse
            const spouse = new FamilyMember({
                ...spouseData,
                treeId,
                maritalStatus: 'MARRIED'
            });
            await spouse.save({});

            // Create Relationship
            const relationship = new FamilyRelationship({
                treeId,
                parentMemberId: member._id,
                childMemberId: spouse._id,
                relationshipType: 'SPOUSE'
            });
            await relationship.save({});

            return spouse;
        } catch (error) {
            throw error;
        }
    }

    async searchMembers(treeId, query) {
        if (!query || !query.trim()) {
            return [];
        }

        const trimmed = query.trim();
        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const members = await FamilyMember.find({
            treeId,
            isDeleted: false,
            name: { $regex: escaped, $options: 'i' }
        })
        .select('_id name gender photoUrl jobTitle maritalStatus')
        .sort({ name: 1 })
        .limit(30)
        .lean();

        return members;
    }

    async getTreeBranch(treeId, rootMemberId, limit = 100, focusMemberId = null) {
        // Phase 8: Lazy Loading via Limit and Ghost Nodes
        const relationships = await FamilyRelationship.find({ treeId }).lean();
        
        let actualRootId = rootMemberId;
        if (!actualRootId) {
            // Find root: member with no parents
            const allChildren = new Set(relationships.map(r => r.childMemberId.toString()));
            const potentialRootRel = relationships.find(r => !allChildren.has(r.parentMemberId.toString()));
            if (potentialRootRel) {
                actualRootId = potentialRootRel.parentMemberId;
            } else {
                const firstMember = await FamilyMember.findOne({ treeId, isDeleted: false }).lean();
                if (firstMember) actualRootId = firstMember._id;
            }
        }

        if (!actualRootId) {
            return { treeId, rootMemberId: null, members: [], relationships: [] };
        }

        const childrenMap = {};
        const parentMap = {};
        const spouseMap = {};

        for (const rel of relationships) {
            const pId = rel.parentMemberId.toString();
            const cId = rel.childMemberId.toString();
            
            if (rel.relationshipType === 'SPOUSE') {
                if (!spouseMap[pId]) spouseMap[pId] = [];
                if (!spouseMap[cId]) spouseMap[cId] = [];
                spouseMap[pId].push(cId);
                spouseMap[cId].push(pId);
            } else {
                if (!childrenMap[pId]) childrenMap[pId] = [];
                childrenMap[pId].push(cId);
                
                if (!parentMap[cId]) parentMap[cId] = [];
                parentMap[cId].push(pId);
            }
        }

        const memberIdsToFetch = new Set([actualRootId.toString()]);

        // If a focusMemberId is specified (e.g. from tree search or after adding a child), ensure the full path
        // from actualRootId down to focusMemberId, as well as focusMemberId's spouse, children, and siblings, are included
        if (focusMemberId) {
            const targetStr = focusMemberId.toString();
            memberIdsToFetch.add(targetStr);

            // Add spouses of target
            const targetSpouses = spouseMap[targetStr] || [];
            for (const sp of targetSpouses) {
                memberIdsToFetch.add(sp);
            }

            // Add immediate children of target and spouses
            const targetChildren = childrenMap[targetStr] || [];
            for (const ch of targetChildren) {
                memberIdsToFetch.add(ch);
            }
            for (const sp of targetSpouses) {
                const spChildren = childrenMap[sp] || [];
                for (const ch of spChildren) {
                    memberIdsToFetch.add(ch);
                }
            }

            // Also ensure siblings of target are fetched so all children under the parent are complete
            const targetParents = parentMap[targetStr] || [];
            for (const pId of targetParents) {
                const siblings = childrenMap[pId] || [];
                for (const sibId of siblings) {
                    memberIdsToFetch.add(sibId);
                }
            }

            // Trace ancestors upwards to root
            let curr = targetStr;
            const visited = new Set();
            while (curr && !visited.has(curr)) {
                visited.add(curr);
                memberIdsToFetch.add(curr);

                const currSpouses = spouseMap[curr] || [];
                for (const sp of currSpouses) {
                    memberIdsToFetch.add(sp);
                }

                const parents = parentMap[curr] || [];
                if (parents.length > 0) {
                    curr = parents[0];
                } else {
                    let spouseParent = null;
                    for (const sp of currSpouses) {
                        const spParents = parentMap[sp] || [];
                        if (spParents.length > 0) {
                            spouseParent = spParents[0];
                            break;
                        }
                    }
                    curr = spouseParent;
                }
            }
        }

        let queue = [actualRootId.toString()];

        // BFS to collect up to `limit` nodes (preferring children and spouses)
        const effectiveLimit = Math.max(limit, memberIdsToFetch.size) + (focusMemberId ? 50 : 0);
        while (queue.length > 0 && memberIdsToFetch.size < effectiveLimit) {
            const currentId = queue.shift();
            
            // Add spouses
            const spouses = spouseMap[currentId] || [];
            for (const spouse of spouses) {
                if (!memberIdsToFetch.has(spouse)) {
                    memberIdsToFetch.add(spouse);
                    queue.push(spouse); // we can push spouse to queue but be careful about limit
                }
            }

            // Add ALL immediate children together so sibling groups are never partially split into ghosts
            const children = childrenMap[currentId] || [];
            for (const child of children) {
                if (!memberIdsToFetch.has(child)) {
                    memberIdsToFetch.add(child);
                    queue.push(child);
                }
            }
        }

        // Fetch the full members
        const members = await FamilyMember.find({ 
            treeId, 
            _id: { $in: Array.from(memberIdsToFetch) },
            isDeleted: false 
        }).lean();

        // Identify boundary nodes (parents or children not in the set) and create ghosts
        const ghostMap = new Map();
        
        for (const memberId of memberIdsToFetch) {
            const mIdStr = memberId.toString();
            
            // Check missing parents
            const parents = parentMap[mIdStr] || [];
            for (const pId of parents) {
                if (!memberIdsToFetch.has(pId) && !ghostMap.has(pId)) {
                    ghostMap.set(pId, {
                        _id: pId,
                        name: "Load Ancestor",
                        gender: 'MALE', // Fallback, we could fetch real gender if we wanted
                        isFadedSkeleton: true
                    });
                }
            }
            
            // Check missing children
            const children = childrenMap[mIdStr] || [];
            for (const cId of children) {
                if (!memberIdsToFetch.has(cId) && !ghostMap.has(cId)) {
                    ghostMap.set(cId, {
                        _id: cId,
                        name: "Load Descendants",
                        gender: 'MALE',
                        isFadedSkeleton: true
                    });
                }
            }
        }

        const finalMembers = [...members, ...Array.from(ghostMap.values())];

        return {
            treeId,
            rootMemberId: actualRootId,
            members: finalMembers,
            relationships // returning all relationships so layout knows edges exist
        };
    }
}

module.exports = new FamilyMemberService();
