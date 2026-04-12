const resourceModel        = require('../models/resourceModel');
const { handleModelError } = require('../utils/apiError');

exports.listResources = async (req, res, next) => {
  try {
    const { venueId, date } = req.query; // Capture 'date' from Postman URL
    
    // Validate venueId is a number if it exists
    if (venueId && isNaN(parseInt(venueId, 10))) {
      return res.status(400).json({ error: 'BadRequest', message: 'venueId must be a number' });
    }

    const parsedVenueId = venueId ? parseInt(venueId, 10) : null;
    
    // Pass BOTH variables to the model
    const resources = await resourceModel.getAllResources(parsedVenueId, date);
    
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
