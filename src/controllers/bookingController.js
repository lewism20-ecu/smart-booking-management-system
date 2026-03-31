const bookingModel = require('../models/bookingModel');
const venueModel   = require('../models/venueModel');
const resourceModel = require('../models/resourceModel');

/**
 * GET /bookings
 * Returns all bookings for the authenticated user
 */
exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await bookingModel.getBookingsByUser(req.user.userId);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /bookings
 * Creates a new booking for the authenticated user
 */
exports.createBooking = async (req, res, next) => {
  try {
    const { resourceId, startTime, endTime } = req.body;

    if (!resourceId || !startTime || !endTime) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'resourceId, startTime, and endTime are required.'
      });
    }

    // Verify the resource exists
    const resource = await resourceModel.findResourceById(resourceId);
    if (!resource) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Resource not found.'
      });
    }

    const booking = await bookingModel.createBooking(
      req.user.userId,
      resourceId,
      startTime,
      endTime,
      resource.approval_required
    );

    res.status(201).json(booking);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: err.name || 'Error',
        message: err.message
      });
    }
    next(err);
  }
};

/**
 * PATCH /bookings/:id
 * Reschedules an existing booking — must be owner
 */
exports.updateBooking = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { startTime, endTime } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'startTime and endTime are required.'
      });
    }

    const existing = await bookingModel.findBookingById(bookingId);
    if (!existing) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Booking not found.'
      });
    }

    // Only the booking owner can modify
    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to modify this booking.'
      });
    }

    const booking = await bookingModel.rescheduleBooking(
      bookingId, startTime, endTime
    );
    res.json(booking);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        error: err.name || 'Error',
        message: err.message
      });
    }
    next(err);
  }
};

/**
 * DELETE /bookings/:id
 * Cancels a booking — must be owner
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);

    const existing = await bookingModel.findBookingById(bookingId);
    if (!existing) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Booking not found.'
      });
    }

    if (existing.user_id !== req.user.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to cancel this booking.'
      });
    }

    await bookingModel.updateBookingStatus(bookingId, 'cancelled');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /bookings/:id/approve
 * Approves a pending booking — manager/admin only
 * Validates: manager owns the venue, booking is pending
 */
exports.approveBooking = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);

    // Find the booking
    const booking = await bookingModel.findBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Booking not found.'
      });
    }

    // Booking must be pending
    if (booking.status !== 'pending') {
      return res.status(409).json({
        error: 'Conflict',
        message: `Booking cannot be approved — current status is '${booking.status}'.`
      });
    }

    // Verify the manager owns the venue this resource belongs to
    if (req.user.role !== 'admin') {
      const resource = await resourceModel.findResourceById(
        booking.resource_id
      );
      const isManager = await venueModel.isVenueManager(
        req.user.userId, resource.venue_id
      );
      if (!isManager) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not a manager of the venue for this booking.'
        });
      }
    }

    const updated = await bookingModel.updateBookingStatus(
      bookingId, 'approved'
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /bookings/:id/reject
 * Rejects a pending booking — manager/admin only
 * Validates: manager owns the venue, booking is pending
 */
exports.rejectBooking = async (req, res, next) => {
  try {
    const bookingId = parseInt(req.params.id);

    // Find the booking
    const booking = await bookingModel.findBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Booking not found.'
      });
    }

    // Booking must be pending
    if (booking.status !== 'pending') {
      return res.status(409).json({
        error: 'Conflict',
        message: `Booking cannot be rejected — current status is '${booking.status}'.`
      });
    }

    // Verify the manager owns the venue this resource belongs to
    if (req.user.role !== 'admin') {
      const resource = await resourceModel.findResourceById(
        booking.resource_id
      );
      const isManager = await venueModel.isVenueManager(
        req.user.userId, resource.venue_id
      );
      if (!isManager) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You are not a manager of the venue for this booking.'
        });
      }
    }

    const updated = await bookingModel.updateBookingStatus(
      bookingId, 'rejected'
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
