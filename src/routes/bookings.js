const router      = require('express').Router();
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/roleAuth');
const { getBookings, postBooking, deleteBooking } = require("../controllers/bookingController");

// Any authenticated user can view and create bookings
router.get('/', auth, getBookings);
router.post('/', auth, postBooking);

// Only the booking owner can modify or cancel
router.patch('/:id',  auth, (req, res) => res.json({ message: 'Modify booking coming soon' }));
router.delete('/:id', auth, deleteBooking);

// Only managers can approve or reject
router.post('/:id/approve', auth, requireRole('manager', 'admin'), (req, res) =>
    res.json({ message: 'Approve booking coming soon' })
);
router.post('/:id/reject',  auth, requireRole('manager', 'admin'), (req, res) =>
    res.json({ message: 'Reject booking coming soon' })
);

module.exports = router;