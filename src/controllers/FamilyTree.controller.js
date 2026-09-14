const FamilyTreeService = require('../services/FamilyTree.service');
const FamilyMemberService = require('../services/FamilyMember.service');
const AuditLogService = require('../services/AuditLog.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class FamilyTreeController {
    // Trees
    async createTree(req, res) {
        try {
            const tree = await FamilyTreeService.createTree(req.body);
            await AuditLogService.logAction(req.user._id, 'TREE_CREATED', 'FamilyTree', tree._id, null, tree);
            return successResponse(res, 201, 'Tree created successfully', tree);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getTrees(req, res) {
        try {
            const trees = await FamilyTreeService.getAllTrees();
            return successResponse(res, 200, 'Trees fetched successfully', trees);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getTreeBranch(req, res) {
        try {
            const { treeId } = req.params;
            const { rootMemberId } = req.query; // If null, we'll fetch the whole tree or from the main root
            const data = await FamilyMemberService.getTreeBranch(treeId, rootMemberId);
            return successResponse(res, 200, 'Tree branch fetched successfully', data);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    // Members
    async addMember(req, res) {
        try {
            const { treeId } = req.params;
            const member = await FamilyMemberService.createMember(treeId, req.body, req.user._id);
            await AuditLogService.logAction(req.user._id, 'MEMBER_CREATED', 'FamilyMember', member._id, null, member);
            return successResponse(res, 201, 'Member added successfully', member);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getMember(req, res) {
        try {
            const memberId = req.params.memberId;
            let member = await FamilyMemberService.getMemberById(memberId);
            
            // Phase 4: Privacy Filtering Logic
            const isAdminOrSub = ['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY'].includes(req.user?.role);
            if (!isAdminOrSub) {
                const SpecialAccessPermissionService = require('../services/SpecialAccessPermission.service');
                const hasAccess = await SpecialAccessPermissionService.hasAccess(req.user._id, memberId);
                
                if (!hasAccess) {
                    // Filter sensitive fields
                    const memberObj = member.toObject();
                    delete memberObj.phone;
                    delete memberObj.email;
                    delete memberObj.address;
                    delete memberObj.occupationType;
                    delete memberObj.companyName;
                    delete memberObj.businessName;
                    // Add a flag indicating privacy restriction
                    memberObj.isRestricted = true;
                    member = memberObj;
                }
            }

            return successResponse(res, 200, 'Member retrieved successfully', member);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async updateMember(req, res) {
        try {
            const { memberId } = req.params;
            const member = await FamilyMemberService.updateMember(memberId, req.body);
            await AuditLogService.logAction(req.user._id, 'MEMBER_UPDATED', 'FamilyMember', member._id, null, member);
            return successResponse(res, 200, 'Member updated successfully', member);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async addChild(req, res) {
        try {
            const { treeId, parentId } = req.params;
            const child = await FamilyMemberService.addChild(treeId, parentId, req.body, req.user._id);
            await AuditLogService.logAction(req.user._id, 'MEMBER_CREATED', 'FamilyMember', child._id, null, child);
            return successResponse(res, 201, 'Child added successfully', child);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
    async deleteSubtree(req, res) {
        try {
            const { treeId, memberId } = req.params;
            const result = await FamilyMemberService.deleteSubtree(treeId, memberId, req.user._id);
            await AuditLogService.logAction(req.user._id, 'MEMBER_SOFT_DELETED', 'FamilyMember', memberId);
            return successResponse(res, 200, `Successfully deleted ${result.deletedCount} members`, result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async restoreSubtree(req, res) {
        try {
            const { treeId, memberId } = req.params;
            const result = await FamilyMemberService.restoreSubtree(treeId, memberId);
            await AuditLogService.logAction(req.user._id, 'MEMBER_RESTORED', 'FamilyMember', memberId);
            return successResponse(res, 200, `Successfully restored ${result.restoredCount} members`, result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async getDeletedMembers(req, res) {
        try {
            const { treeId } = req.params;
            const FamilyMember = require('../models/FamilyMember.model');
            const deletedMembers = await FamilyMember.find({ treeId, isDeleted: true }).sort({ deletedAt: -1 });
            return successResponse(res, 200, 'Deleted members fetched successfully', deletedMembers);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    // Relationships (Phase 2)
    async moveSubtree(req, res) {
        try {
            const { treeId } = req.params;
            const { subtreeRootId, newParentId } = req.body;
            const FamilyRelationshipService = require('../services/FamilyRelationship.service');
            const result = await FamilyRelationshipService.moveSubtree(treeId, subtreeRootId, newParentId);
            await AuditLogService.logAction(req.user._id, 'SUBTREE_MOVED', 'FamilyMember', subtreeRootId, { oldParent: null }, { newParentId });
            return successResponse(res, 200, 'Subtree moved successfully', result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async insertBetween(req, res) {
        try {
            const { treeId } = req.params;
            const { parentId, childId, newMemberData } = req.body;
            const FamilyRelationshipService = require('../services/FamilyRelationship.service');
            const result = await FamilyRelationshipService.insertBetween(treeId, parentId, childId, newMemberData);
            await AuditLogService.logAction(req.user._id, 'NODE_INSERTED_BETWEEN', 'FamilyMember', result.newMember._id);
            return successResponse(res, 201, 'Node inserted successfully', result);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new FamilyTreeController();
