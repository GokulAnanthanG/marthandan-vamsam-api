const express = require('express');
const router = express.Router();
const businessWorkController = require('../controllers/BusinessWork.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/businesses', businessWorkController.getBusinessList);
router.get('/work-profiles', businessWorkController.getWorkList);
router.get('/relatives', businessWorkController.getRelativesDirectory);
router.get('/businesses/:ownerId/employees', businessWorkController.getEmployees);

module.exports = router;
