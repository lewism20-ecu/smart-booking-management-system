const router     = require('express').Router();
const auth       = require('../middleware/auth');
const requireRole = require('../middleware/roleAuth');
const {
  listResources,
  createResource
} = require('../controllers/resourceController');

router.get('/',  auth, listResources);
router.post('/', auth, requireRole('admin'), createResource);

module.exports = router;
