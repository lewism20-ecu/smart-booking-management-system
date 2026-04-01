const router      = require('express').Router();
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/roleAuth');
const {
  getBookings,
  createBooking,
  updateBooking,
  cancelBooking,
  approveBooking,
  rejectBooking,
} = require('../controllers/bookingController');

// Any authenticated user
router.get('/',    auth, getBookings);
router.post('/',   auth, createBooking);
router.patch('/:id',  auth, updateBooking);
router.delete('/:id', auth, cancelBooking);

// Manager or admin only
router.post('/:id/approve', auth, requireRole('manager', 'admin'), approveBooking);
router.post('/:id/reject',  auth, requireRole('manager', 'admin'), rejectBooking);

module.exports = router;
