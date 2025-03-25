const Event = require('../models/Event');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Public
 */
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true }).select('-__v');

    return res.status(200).json(
      successResponse('Data event berhasil diambil', events)
    );
  } catch (error) {
    logger.error(`Error in getEvents: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('-__v');

    if (!event) {
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }

    const availability = event.checkAvailability();

    return res.status(200).json(
      successResponse('Data event berhasil diambil', { 
        ...event.toObject(), 
        ...availability 
      })
    );
  } catch (error) {
    logger.error(`Error in getEventById: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Create new event
 * @route   POST /api/events
 * @access  Private/Admin
 */
const createEvent = async (req, res) => {
  try {
    const {
      name,
      type,
      date,
      quota,
      price,
      description,
      requireFoodAllergy
    } = req.body;

    const isFoodAllergyRequired = type === 'Main Event' ? true : requireFoodAllergy || false;

    const event = new Event({
      name,
      type,
      date,
      quota,
      price,
      description,
      requireFoodAllergy: isFoodAllergyRequired
    });

    await event.save();

    return res.status(201).json(
      successResponse('Event berhasil dibuat', event)
    );
  } catch (error) {
    logger.error(`Error in createEvent: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/events/:id
 * @access  Private/Admin
 */
const updateEvent = async (req, res) => {
  try {
    const {
      name,
      type,
      date,
      quota,
      price,
      description,
      requireFoodAllergy,
      isActive
    } = req.body;

    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }

    if (name) event.name = name;
    if (type) event.type = type;
    if (date) event.date = date;
    if (typeof quota !== 'undefined') event.quota = quota;
    if (typeof price !== 'undefined') event.price = price;
    if (description) event.description = description;
    if (typeof requireFoodAllergy !== 'undefined') {
      if (event.type === 'Main Event' || type === 'Main Event') {
        event.requireFoodAllergy = true;
      } else {
        event.requireFoodAllergy = requireFoodAllergy;
      }
    }
    if (typeof isActive !== 'undefined') event.isActive = isActive;

    await event.save();

    return res.status(200).json(
      successResponse('Event berhasil diupdate', event)
    );
  } catch (error) {
    logger.error(`Error in updateEvent: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private/Admin
 */
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }

    event.isActive = false;
    await event.save();

    return res.status(200).json(
      successResponse('Event berhasil dinonaktifkan')
    );
  } catch (error) {
    logger.error(`Error in deleteEvent: ${error.message}`);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json(
        errorResponse('Event tidak ditemukan')
      );
    }
    
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};