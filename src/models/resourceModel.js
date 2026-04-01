const { pool } = require('../db');

const VALID_TYPES = ['seat', 'room', 'desk', 'hybrid'];

/**
 * Create a new resource within a venue
 * @param {Object} data - Resource data
 * @returns {Promise<Object>} Created resource record
 * @throws {Error} 400 if resourceType is invalid
 * @throws {Error} 23505 if name already exists in venue
 */
async function createResource({
  venueId, name, capacity, resourceType, tags = [],
  availabilityStart = null, availabilityEnd = null,
  approvalRequired = false
}) {
  if (!VALID_TYPES.includes(resourceType)) {
    const err = new Error(
      `Invalid resourceType. Must be one of: ${VALID_TYPES.join(', ')}`
    );
    err.status = 400;
    throw err;
  }

  if (capacity < 1) {
    const err = new Error('Capacity must be greater than 0.');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `INSERT INTO resources
       (venue_id, name, capacity, resource_type, tags,
        availability_start, availability_end, approval_required)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [venueId, name, capacity, resourceType, tags,
     availabilityStart, availabilityEnd, approvalRequired]
  );
  return rows[0];
}

/**
 * Get all resources, optionally filtered by venue
 * @param {number|null} venueId - Optional venue filter
 * @returns {Promise<Array>} List of resources
 */
async function getAllResources(venueId = null) {
  if (venueId) {
    const { rows } = await pool.query(
      `SELECT * FROM resources
       WHERE venue_id = $1
       ORDER BY name ASC`,
      [venueId]
    );
    return rows;
  }

  const { rows } = await pool.query(
    `SELECT * FROM resources ORDER BY name ASC`
  );
  return rows;
}

/**
 * Find a resource by ID
 * @param {number} resourceId
 * @returns {Promise<Object|null>}
 */
async function findResourceById(resourceId) {
  const { rows } = await pool.query(
    `SELECT * FROM resources WHERE resource_id = $1`,
    [resourceId]
  );
  return rows[0] || null;
}

/**
 * Update a resource
 * @param {number} resourceId
 * @param {Object} updates
 * @returns {Promise<Object>} Updated resource
 */
async function updateResource(resourceId, updates) {
  const { name, capacity, tags, availabilityStart,
          availabilityEnd, approvalRequired } = updates;

  if (capacity !== undefined && capacity < 1) {
    const err = new Error('Capacity must be greater than 0.');
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE resources
     SET name               = COALESCE($1, name),
         capacity           = COALESCE($2, capacity),
         tags               = COALESCE($3, tags),
         availability_start = COALESCE($4, availability_start),
         availability_end   = COALESCE($5, availability_end),
         approval_required  = COALESCE($6, approval_required)
     WHERE resource_id = $7
     RETURNING *`,
    [name, capacity, tags, availabilityStart,
     availabilityEnd, approvalRequired, resourceId]
  );

  if (!rows.length) {
    const err = new Error('Resource not found.');
    err.status = 404;
    throw err;
  }

  return rows[0];
}

/**
 * Delete a resource
 * @param {number} resourceId
 * @returns {Promise<boolean>}
 */
async function deleteResource(resourceId) {
  const { rowCount } = await pool.query(
    `DELETE FROM resources WHERE resource_id = $1`,
    [resourceId]
  );
  return rowCount > 0;
}

module.exports = {
  createResource,
  getAllResources,
  findResourceById,
  updateResource,
  deleteResource,
  VALID_TYPES,
};
