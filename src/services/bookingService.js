const pool = require("../db/index");

async function getBookingsForUser(userId) {
    const result = await pool.query(
        `SELECT
            b.booking_id,
            b.resource_id,
            b.start_time,
            b.end_time,
            b.status,
            b.created_at,
            r.name AS resource_name,
            r.venue_id
        FROM bookings b
        JOIN resources r ON b.resource_id = r.resource_id
        WHERE b.user_id = $1
        ORDER BY b.start_time DESC`,
        [userId]
    );

    return result.rows;
}

module.exports = { getBooksForUser };