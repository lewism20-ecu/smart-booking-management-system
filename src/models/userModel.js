const { pool } = require('../db');

/**
 * Create a new user
 * @param {string} email - Unique email address
 * @param {string} hashedPassword - bcrypt hashed password
 * @returns {Promise<Object>} Created user record
 * @throws {Error} 23505 if email already exists
 */
async function createUser(email, hashedPassword) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password)
     VALUES ($1, $2)
     RETURNING user_id, email, role, created_at`,
    [email, hashedPassword]
  );
  return rows[0];
}

/**
 * Find a user by email address
 * @param {string} email
 * @returns {Promise<Object|null>} User record or null if not found
 */
async function findUserByEmail(email) {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Find a user by ID including their managed venues
 * @param {number} userId
 * @returns {Promise<Object|null>} User record with managed_venues array or null
 */
async function findUserById(userId) {
  const { rows } = await pool.query(
    `SELECT u.user_id, u.email, u.role, u.created_at,
            COALESCE(
              array_agg(vm.venue_id)
              FILTER (WHERE vm.venue_id IS NOT NULL), '{}'
            ) AS managed_venues
     FROM users u
     LEFT JOIN venue_managers vm ON vm.user_id = u.user_id
     WHERE u.user_id = $1
     GROUP BY u.user_id`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Update a user's role
 * @param {number} userId
 * @param {string} role - 'user' | 'admin' | 'manager'
 * @returns {Promise<Object>} Updated user record
 */
async function updateUserRole(userId, role) {
  const validRoles = ['user', 'admin', 'manager'];
  if (!validRoles.includes(role)) {
    const err = new Error(`Invalid role: ${role}`);
    err.status = 400;
    throw err;
  }

  const { rows } = await pool.query(
    `UPDATE users SET role = $1
     WHERE user_id = $2
     RETURNING user_id, email, role`,
    [role, userId]
  );

  if (!rows.length) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  return rows[0];
}

/**
 * Delete a user by ID
 * @param {number} userId
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
async function deleteUser(userId) {
  const { rowCount } = await pool.query(
    `DELETE FROM users WHERE user_id = $1`,
    [userId]
  );
  return rowCount > 0;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserRole,
  deleteUser,
};
