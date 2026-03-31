const { pool } = require("../db/index");

async function getUserProfile(userId) {
  // Fetch user
  const userResult = await pool.query(
    `SELECT user_id, email, role
        FROM users
        WHERE user_id = $1`,
    [userId],
  );

  if (userResult.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult.rows[0];

  // Fetch venused managed by this user
  const venuesResult = await pool.query(
    `SELECT v.venue_id, v.name
        FROM venues v
        JOIN venue_managers vm ON v.venue_id = vm.venue_id
        WHERE vm.user_id = $1`,
    [userId],
  );

  const managedVenues = venuesResult.rows.map((v) => v.name);

  return {
    userId: user.user_id,
    email: user.email,
    role: user.role,
    managedVenues,
  };
}

module.exports = { getUserProfile };
