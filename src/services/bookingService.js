const { pool } = require("../db/index");

async function resourceExists(resourceId) {
    const result = await pool.query(
        `SELECT resource_id, approval_required FROM resources WHERE resource_id = $1`
        [resourceId]
    );
    return result.rows[0] || null;
}

async function hasOverlap(resourceId, startTime, endTime) {
    const result = await pool.query(
        `SELECT 1
        FROM bookings
        WHERE resource_id = $1
            AND NOT ($3 <= start_time OR $2 >= end_time)`,
        [resourceId, startTime, endTime]
    );
    return result.rowCount > 0;
}

async function createBooking(userId, resourceId, startTime, endTime, status) {
    const result = await pool.query(
        `INSERT INTO bookings (user_id, resource_id, start_time, end_time, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING booking_id, status`,
        [userId, resourceId, startTime, endTime, status]
    );
    return result.rows[0];
}

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

module.exports = { getBookingsForUser, resourceExists, hasOverlap, createBooking };