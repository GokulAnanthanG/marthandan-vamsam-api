const Event = require('../models/Event.model');
const { successResponse } = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

const createEvent = async (req, res, next) => {
    try {
        const { eventName, date, time, location, description } = req.body;
        
        // If Admin/Sub Admin, they can create approved events directly.
        // For now, let's set it to Pending unless logic requires otherwise.
        let status = 'Pending';
        if (req.user.role === 'ADMIN' || req.user.role === 'SUB_ADMIN') {
            status = 'Approved';
        }

        const newEvent = await Event.create({
            eventName,
            date,
            time,
            location,
            description,
            addedBy: req.user.id,
            status
        });

        return successResponse(res, 201, 'Event created successfully', newEvent);
    } catch (error) {
        next(error);
    }
};

const getEvents = async (req, res, next) => {
    try {
        const { date, status } = req.query;
        
        let query = {};
        if (status) {
            query.status = status;
        } else if (req.user.role !== 'ADMIN' && req.user.role !== 'SUB_ADMIN') {
            // Normal users only see approved events
            query.status = 'Approved';
        }

        if (date) {
            // Query for specific date
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        const events = await Event.find(query)
            .populate('addedBy', 'fullName mobileNumber')
            .sort({ date: 1, time: 1 });

        return successResponse(res, 200, 'Events fetched successfully', events);
    } catch (error) {
        next(error);
    }
};

const updateEventStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
            throw new ApiError(400, 'Invalid status');
        }

        const event = await Event.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!event) {
            throw new ApiError(404, 'Event not found');
        }

        return successResponse(res, 200, 'Event status updated', event);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createEvent,
    getEvents,
    updateEventStatus
};
