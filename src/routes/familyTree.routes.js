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
router.get('/members/:memberId', FamilyTreeController.getMember);
router.put('/members/:memberId', roleMiddleware(['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY']), FamilyTreeController.updateMember);
router.post('/:treeId/members/:parentId/children', roleMiddleware(['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY']), FamilyTreeController.addChild);
router.delete('/:treeId/members/:memberId', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.deleteSubtree);
router.post('/:treeId/members/:memberId/restore-subtree', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.restoreSubtree);
router.get('/:treeId/deleted-members', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.getDeletedMembers);
// Relationships
router.post('/:treeId/relationships/move-subtree', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.moveSubtree);
router.post('/:treeId/relationships/insert-between', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.insertBetween);

module.exports = router;
