const express = require('express');
const router = express.Router();
const matrimonialController = require('../controllers/Matrimonial.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/profiles', matrimonialController.getProfiles);
router.get('/profiles/:id', matrimonialController.getProfileDetail);
router.patch('/profiles/:id/assets', matrimonialController.updateAssets);

module.exports = router;
