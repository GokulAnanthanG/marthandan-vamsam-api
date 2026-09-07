const express = require('express');
const router = express.Router();
const FamilyTreeController = require('../controllers/FamilyTree.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Apply auth middleware to all tree routes
router.use(authMiddleware);

// Trees
router.post('/', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.createTree);
router.get('/', FamilyTreeController.getTrees);
router.get('/:treeId/tree', FamilyTreeController.getTreeBranch);

// Members
router.post('/:treeId/members', roleMiddleware(['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY']), FamilyTreeController.addMember);
router.post('/:treeId/members/:parentId/children', roleMiddleware(['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY']), FamilyTreeController.addChild);

module.exports = router;
