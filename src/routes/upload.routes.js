const express = require('express');
const uploadController = require('../controllers/upload.controller');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Not placing auth middleware here yet in case registration needs it before user is created,
// but in production we might require temporary token or secure upload.
router.post('/profile-photo', upload.single('photo'), uploadController.uploadProfilePhoto);

module.exports = router;
