const FamilyTree = require('../models/FamilyTree.model');
const ApiError = require('../utils/apiError');

class FamilyTreeService {
    async createTree(data) {
        const tree = new FamilyTree(data);
        await tree.save();
        return tree;
    }

    async getTreeById(treeId) {
        const tree = await FamilyTree.findById(treeId);
        if (!tree) {
            throw new ApiError(404, 'Family tree not found');
        }
        return tree;
    }
    
    async getAllTrees() {
        return await FamilyTree.find({ status: 'ACTIVE' });
    }
}

module.exports = new FamilyTreeService();
