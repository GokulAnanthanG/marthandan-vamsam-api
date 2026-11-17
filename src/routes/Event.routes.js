const express = require('express');
const router = express.Router();
const eventController = require('../controllers/Event.controller');
const auth = require('../middlewares/auth.middleware');
const checkRole = require('../middlewares/role.middleware');

router.use(auth);

router.post('/', eventController.createEvent);
router.get('/', eventController.getEvents);
router.patch('/:id/status', checkRole(['ADMIN', 'SUB_ADMIN']), eventController.updateEventStatus);

module.exports = router;
