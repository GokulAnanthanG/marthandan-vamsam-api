const express = require('express');
const router = express.Router();
const FamilyTreeController = require('../controllers/FamilyTree.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Public/Guest allowed Read-only routes
router.get('/', FamilyTreeController.getTrees);
router.get('/:treeId/tree', FamilyTreeController.getTreeBranch);
router.get('/:treeId/members/search', FamilyTreeController.searchMembers);
router.get('/members/:memberId', FamilyTreeController.getMember);

// Apply auth middleware to all other tree routes (mutations)
router.use(authMiddleware);

// Trees
router.post('/', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.createTree);

// Members
router.post('/:treeId/members', roleMiddleware(['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY']), FamilyTreeController.addMember);
router.put('/members/:memberId', roleMiddleware(['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY']), FamilyTreeController.updateMember);
router.post('/:treeId/members/:parentId/children', roleMiddleware(['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY']), FamilyTreeController.addChild);
router.post('/:treeId/members/:memberId/spouse', roleMiddleware(['ADMIN', 'SUB_ADMIN', 'DATA_ENTRY']), FamilyTreeController.addSpouse);
router.delete('/:treeId/members/:memberId', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.deleteSubtree);
router.post('/:treeId/members/:memberId/restore-subtree', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.restoreSubtree);
router.get('/:treeId/deleted-members', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.getDeletedMembers);
// Relationships
router.post('/:treeId/relationships/move-subtree', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.moveSubtree);
router.post('/:treeId/relationships/insert-between', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyTreeController.insertBetween);

module.exports = router;
