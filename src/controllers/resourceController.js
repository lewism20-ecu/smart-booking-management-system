const resourceModel        = require('../models/resourceModel');
const { handleModelError } = require('../utils/apiError');

exports.listResources = async (req, res, next) => {
  try {
    const venueId = req.query.venueId
      ? parseInt(req.query.venueId, 10)
      : null;
    const resources = await resourceModel.getAllResources(venueId);
    res.json(resources);
  } catch (err) {
    next(err);
  }
};

exports.createResource = async (req, res, next) => {
  try {
    const { venueId, name, capacity, resourceType,
            tags, availabilityStart, availabilityEnd,
            approvalRequired } = req.body;

    if (!venueId || !name || !capacity || !resourceType) {
      return res.status(400).json({
        error:   'BadRequest',
        message: 'venueId, name, capacity, and resourceType are required.'
      });
    }

    const resource = await resourceModel.createResource({
      venueId, name, capacity, resourceType,
      tags, availabilityStart, availabilityEnd, approvalRequired
    });

    res.status(201).json(resource);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error:   'Conflict',
        message: 'A resource with that name already exists in this venue.'
      });
    }
    handleModelError(err, res, next);
  }
};
