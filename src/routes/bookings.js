const router      = require('express').Router();
const auth        = require('../middleware/auth');
const requireRole = require('../middleware/roleAuth');

// Any authenticated user can view and create bookings
router.get('/',    auth, (req, res) => res.json([]));
router.post('/',   auth, (req, res) => res.status(201).json({ message: 'Booking logic coming soon' }));

// Only the booking owner can modify or cancel
router.patch('/:id',  auth, (req, res) => res.json({ message: 'Modify booking coming soon' }));
router.delete('/:id', auth, (req, res) => res.status(204).send());

// Only managers can approve or reject
router.post('/:id/approve', auth, requireRole('manager', 'admin'), (req, res) =>
    res.json({ message: 'Approve booking coming soon' })
);
router.post('/:id/reject',  auth, requireRole('manager', 'admin'), (req, res) =>
    res.json({ message: 'Reject booking coming soon' })
);

module.exports = router;