const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/family-trees', require('./familyTree.routes'));
router.use('/family-data-requests', require('./familyRequest.routes'));
router.use('/special-access-permissions', require('./specialAccessPermission.routes'));
router.use('/family-media', require('./familyMedia.routes'));

module.exports = router;
