const express = require('express');
const router = express.Router();
const FamilyRequestController = require('../controllers/FamilyRequest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Anyone can create or get requests
router.post('/', FamilyRequestController.createRequest);
router.get('/', FamilyRequestController.getRequests);
router.get('/:requestId', FamilyRequestController.getRequestById);

// Only admins/sub_admins can review requests
router.post('/:requestId/approve', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyRequestController.approveRequest);
router.post('/:requestId/reject', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyRequestController.rejectRequest);
router.post('/:requestId/request-changes', roleMiddleware(['ADMIN', 'SUB_ADMIN']), FamilyRequestController.requestChanges);

module.exports = router;
