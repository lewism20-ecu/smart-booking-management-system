const { pool } = require('../db');

/**
 * Check for overlapping bookings (double-booking prevention)
 * @param {number} resourceId
 * @param {string} startTime - ISO timestamp
 * @param {string} endTime - ISO timestamp
 * @param {number|null} excludeBookingId - Exclude this booking (for updates)
 * @returns {Promise<boolean>} True if conflict exists
 */
async function hasConflict(resourceId, startTime, endTime,
                            excludeBookingId = null) {
  const { rows } = await pool.query(
    `SELECT 1 FROM bookings
     WHERE resource_id = $1
       AND status NOT IN ('cancelled', 'rejected')
       AND start_time < $3
       AND end_time   > $2
       AND ($4::int IS NULL OR booking_id != $4)
     LIMIT 1`,
    [resourceId, startTime, endTime, excludeBookingId]
  );
  return rows.length > 0;
}

/**
 * Validate that a timestamp string is parseable
 * @param {string} value
 * @param {string} fieldName
 * @throws {Error} 400 if not a valid date
 */
function validateTimestamp(value, fieldName) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new Error(`${fieldName} is not a valid date.`);
    err.status = 400;
    throw err;
  }
  return date;
}

/**
 * Create a new booking
 * @param {number} userId
 * @param {number} resourceId
 * @param {string} startTime
 * @param {string} endTime
 * @param {boolean} approvalRequired
 * @returns {Promise<Object>} Created booking
 * @throws {Error} 400 if times are invalid
 * @throws {Error} 409 if time slot is already booked
 */
async function createBooking(userId, resourceId,
                              startTime, endTime,
                              approvalRequired = false) {
  const start = validateTimestamp(startTime, 'startTime');
  const end   = validateTimestamp(endTime, 'endTime');

  if (start >= end) {
    const err = new Error('startTime must be before endTime.');
    err.status = 400;
    throw err;
  }

  const conflict = await hasConflict(resourceId, startTime, endTime);
  if (conflict) {
    const err = new Error(
      'Resource is already booked for this time window.'
    );
    err.status = 409;
    throw err;
  }

  const status = approvalRequired ? 'pending' : 'approved';

  const { rows } = await pool.query(
    `INSERT INTO bookings
       (user_id, resource_id, start_time, end_time, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, resourceId, startTime, endTime, status]
  );
  return rows[0];
}

/**
 * Get all bookings for a user
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function getBookingsByUser(userId) {
  const { rows } = await pool.query(
    `SELECT b.*, r.name AS resource_name, v.name AS venue_name
     FROM bookings b
     JOIN resources r ON r.resource_id = b.resource_id
     JOIN venues v    ON v.venue_id    = r.venue_id
     WHERE b.user_id = $1
     ORDER BY b.start_time DESC`,
    [userId]
  );
  return rows;
}

/**
 * Find a booking by ID
 * @param {number} bookingId
 * @returns {Promise<Object|null>}
 */
async function findBookingById(bookingId) {
  const { rows } = await pool.query(
    `SELECT * FROM bookings WHERE booking_id = $1`,
    [bookingId]
  );
  return rows[0] || null;
}

/**
 * Update booking times (reschedule)
 * @param {number} bookingId
 * @param {string} startTime
 * @param {string} endTime
 * @returns {Promise<Object>} Updated booking
 * @throws {Error} 400 if times are invalid
 * @throws {Error} 404 if booking not found
 * @throws {Error} 409 if time slot is already booked
 */
async function rescheduleBooking(bookingId, startTime, endTime) {
  // Validate timestamps before hitting the DB
  const start = validateTimestamp(startTime, 'startTime');
  const end   = validateTimestamp(endTime, 'endTime');

  if (start >= end) {
    const err = new Error('startTime must be before endTime.');
    err.status = 400;
    throw err;
  }

  const booking = await findBookingById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found.');
    err.status = 404;
    throw err;
  }

  const conflict = await hasConflict(
    booking.resource_id, startTime, endTime, bookingId
  );
  if (conflict) {
    const err = new Error(
      'Resource is already booked for this time window.'
    );
    err.status = 409;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE bookings
     SET start_time = $1,
         end_time   = $2,
         status     = 'pending'
     WHERE booking_id = $3
     RETURNING *`,
    [startTime, endTime, bookingId]
  );
  return rows[0];
}

/**
 * Update booking status
 * @param {number} bookingId
 * @param {string} status - 'approved'|'rejected'|'cancelled'
 * @returns {Promise<Object>} Updated booking
 * @throws {Error} 400 if status is invalid
 * @throws {Error} 404 if booking not found
 */
async function updateBookingStatus(bookingId, status) {
  const validStatuses = ['approved', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) {
    const err = new Error(
      `Invalid status. Must be: ${validStatuses.join(', ')}`
    );
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE bookings SET status = $1
     WHERE booking_id = $2
     RETURNING *`,
    [status, bookingId]
  );

  if (!rows.length) {
    const err = new Error('Booking not found.');
    err.status = 404;
    throw err;
  }

  return rows[0];
}

module.exports = {
  hasConflict,
  createBooking,
  getBookingsByUser,
  findBookingById,
  rescheduleBooking,
  updateBookingStatus,
};
