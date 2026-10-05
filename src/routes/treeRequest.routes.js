const express = require('express');
const treeRequestController = require('../controllers/treeRequest.controller');
const auth = require('../middlewares/auth.middleware');
const roleGuard = require('../middlewares/role.middleware');

const router = express.Router();

// Public/Guest endpoints
router.post('/', treeRequestController.submitRequest);

// Admin/Sub-Admin endpoints
router.use(auth);
router.use(roleGuard(['ADMIN', 'SUB_ADMIN']));

router.get('/', treeRequestController.getRequests);
router.post('/:requestId/approve', treeRequestController.approveRequest);
router.post('/:requestId/reject', treeRequestController.rejectRequest);

module.exports = router;
