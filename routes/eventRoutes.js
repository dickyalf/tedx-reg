const express = require('express');
const router = express.Router();
const { 
  getEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} = require('../controllers/eventController');
const { protect, adminOnly } = require('../middleware/auth');
const { eventValidators } = require('../utils/validators');
const { validate } = require('../middleware/validator');
const { apiLimiter } = require('../middleware/rateLimiter');

router.get('/', apiLimiter, getEvents);
router.get('/:id', apiLimiter, getEventById);

router.post('/', [protect, adminOnly, eventValidators, validate], createEvent);
router.put('/:id', [protect, adminOnly, eventValidators, validate], updateEvent);
router.delete('/:id', [protect, adminOnly], deleteEvent);

module.exports = router;