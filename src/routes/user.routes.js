const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const statusMiddleware = require('../middlewares/status.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(statusMiddleware);

router.get('/profile', userController.getProfile);

module.exports = router;
