const { pool } = require('../db');

/**
 * Create a new venue and assign the creator as manager
 * @param {string} name - Venue name
 * @param {boolean} approvalRequired - Whether bookings need approval
 * @param {number} creatorUserId - User ID of the creator
 * @returns {Promise<Object>} Created venue record
 */
async function createVenue(name, approvalRequired = false, creatorUserId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO venues (name, approval_required)
       VALUES ($1, $2)
       RETURNING *`,
      [name, approvalRequired]
    );
    const venue = rows[0];

    // Automatically assign creator as manager
    await client.query(
      `INSERT INTO venue_managers (user_id, venue_id)
       VALUES ($1, $2)`,
      [creatorUserId, venue.venue_id]
    );

    // Upgrade user role to manager if not already admin
    await client.query(
      `UPDATE users SET role = 'manager'
       WHERE user_id = $1 AND role = 'user'`,
      [creatorUserId]
    );

    await client.query('COMMIT');
    return venue;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all venues
 * @returns {Promise<Array>} List of all venues
 */
async function getAllVenues() {
  const { rows } = await pool.query(
    `SELECT v.*, COALESCE(array_agg(vm.user_id) FILTER (WHERE vm.user_id IS NOT NULL), '{}') AS manager_ids
     FROM venues v
     LEFT JOIN venue_managers vm ON vm.venue_id = v.venue_id
     GROUP BY v.venue_id
     ORDER BY v.created_at DESC`
  );
  return rows;
}

/**
 * Get a venue by ID
 * @param {number} venueId
 * @returns {Promise<Object|null>} Venue record or null
 */
async function findVenueById(venueId) {
  const { rows } = await pool.query(
    `SELECT v.*, COALESCE(array_agg(vm.user_id) FILTER (WHERE vm.user_id IS NOT NULL), '{}') AS manager_ids
     FROM venues v
     LEFT JOIN venue_managers vm ON vm.venue_id = v.venue_id
     WHERE v.venue_id = $1
     GROUP BY v.venue_id`,
    [venueId]
  );
  return rows[0] || null;
}

/**
 * Update venue settings
 * @param {number} venueId
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated venue record
 */
async function updateVenue(venueId, { name, approvalRequired }) {
  const { rows } = await pool.query(
    `UPDATE venues
     SET name = COALESCE($1, name),
         approval_required = COALESCE($2, approval_required)
     WHERE venue_id = $3
     RETURNING *`,
    [name, approvalRequired, venueId]
  );

  if (!rows.length) {
    const err = new Error('Venue not found.');
    err.status = 404;
    throw err;
  }

  return rows[0];
}

/**
 * Delete a venue by ID
 * @param {number} venueId
 * @returns {Promise<boolean>} True if deleted
 */
async function deleteVenue(venueId) {
  const { rowCount } = await pool.query(
    `DELETE FROM venues WHERE venue_id = $1`,
    [venueId]
  );
  return rowCount > 0;
}

/**
 * Check if a user is a manager of a venue
 * @param {number} userId
 * @param {number} venueId
 * @returns {Promise<boolean>}
 */
async function isVenueManager(userId, venueId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM venue_managers
     WHERE user_id = $1 AND venue_id = $2`,
    [userId, venueId]
  );
  return rows.length > 0;
}

module.exports = {
  createVenue,
  getAllVenues,
  findVenueById,
  updateVenue,
  deleteVenue,
  isVenueManager,
};
