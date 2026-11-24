const express = require('express');
const router = express.Router();
const houseController = require('../controllers/House.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', houseController.getHouses);
router.get('/check-access', houseController.checkAccess);

module.exports = router;
