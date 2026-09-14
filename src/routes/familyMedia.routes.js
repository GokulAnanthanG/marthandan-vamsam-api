const express = require('express');
const router = express.Router();
const FamilyMediaController = require('../controllers/FamilyMedia.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Head Details
router.get('/all-head-details/:treeId', FamilyMediaController.getAllHeadDetails);
router.get('/head-details/:treeId/:headMemberId', FamilyMediaController.getHeadDetails);
router.put('/head-details/:treeId/:headMemberId', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyMediaController.updateHeadDetails);

// Branch Photos
router.get('/branch-photos/:rootMemberId', FamilyMediaController.getBranchPhotos);
router.post('/branch-photos/:rootMemberId', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyMediaController.addBranchPhoto);
router.delete('/branch-photos/:photoId', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyMediaController.deleteBranchPhoto);

module.exports = router;
