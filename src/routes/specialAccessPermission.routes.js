const express = require('express');
const router = express.Router();
const SpecialAccessPermissionController = require('../controllers/SpecialAccessPermission.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Users can request access and view their own permissions
router.post('/', SpecialAccessPermissionController.requestAccess);
router.get('/', SpecialAccessPermissionController.getPermissions);

// Admins manage permissions
router.post('/:permissionId/approve', roleMiddleware(['ADMIN', 'SUB_ADMIN']), SpecialAccessPermissionController.approveAccess);
router.post('/:permissionId/reject', roleMiddleware(['ADMIN', 'SUB_ADMIN']), SpecialAccessPermissionController.rejectAccess);
router.post('/:permissionId/revoke', roleMiddleware(['ADMIN', 'SUB_ADMIN']), SpecialAccessPermissionController.revokeAccess);

module.exports = router;
