const { pool } = require('../db');

exports.listResources = async (req, res, next) => {
  try {
    const { venueId } = req.query;
    let query    = 'SELECT * FROM resources';
    const params = [];

    if (venueId) {
      query += ' WHERE venue_id = $1';
      params.push(venueId);
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.createResource = async (req, res, next) => {
  try {
    const { venueId, name, capacity, resourceType, tags } = req.body;

    if (!venueId || !name || !capacity || !resourceType) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'venueId, name, capacity, and resourceType are required.'
      });
    }

    const validTypes = ['seat', 'room', 'desk', 'hybrid'];
    if (!validTypes.includes(resourceType)) {
      return res.status(400).json({
        error: 'BadRequest',
        message: `resourceType must be one of: ${validTypes.join(', ')}`
      });
    }

    if (capacity < 1) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Capacity must be greater than 0.'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO resources (venue_id, name, capacity, resource_type, tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [venueId, name, capacity, resourceType, tags || []]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A resource with that name already exists in this venue.'
      });
    }
    next(err);
  }
};
