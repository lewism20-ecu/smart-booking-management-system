exports.getMe = (req, res) => {
  res.json({
    message: "usersController.getMe is working",
    user: req.user
  });
};


/*
const { pool } = require('../db');

exports.getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.user_id, u.email, u.role,
              COALESCE(
                array_agg(vm.venue_id) FILTER (WHERE vm.venue_id IS NOT NULL),
                '{}'
              ) AS managed_venues
       FROM users u
       LEFT JOIN venue_managers vm ON vm.user_id = u.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [req.user.userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'NotFound', message: 'User not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

*/