const FamilyTreeService = require('../services/FamilyTree.service');
const FamilyMemberService = require('../services/FamilyMember.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

class FamilyTreeController {
    // Trees
    async createTree(req, res) {
        try {
            const tree = await FamilyTreeService.createTree(req.body);
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
            return successResponse(res, 201, 'Member added successfully', member);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }

    async addChild(req, res) {
        try {
            const { treeId, parentId } = req.params;
            const child = await FamilyMemberService.addChild(treeId, parentId, req.body, req.user._id);
            return successResponse(res, 201, 'Child added successfully', child);
        } catch (error) {
            return errorResponse(res, error.statusCode || 500, error.message);
        }
    }
}

module.exports = new FamilyTreeController();
