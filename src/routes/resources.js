const router      = require('express').Router();
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/roleAuth');
const {
  listResources,
  createResource
} = require('../controllers/resourceController');

// Any authenticated user can list resources
router.get('/',  auth, listResources);

// Only admins can create resources
router.post('/', auth, requireRole('admin'), createResource);

module.exports = router;