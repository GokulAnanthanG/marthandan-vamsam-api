const express = require('express');
const router = express.Router();
const accessRequestController = require('../controllers/AccessRequest.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/', accessRequestController.createRequest);
router.get('/', accessRequestController.getRequestsByTab);
router.get('/my-sent', accessRequestController.getMySentRequests);
router.patch('/:id/approve', accessRequestController.approveRequest);
router.patch('/:id/reject', accessRequestController.rejectRequest);

module.exports = router;
