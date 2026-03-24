const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const bookingsController = require("../controllers/bookingController");

router.get("/", auth, bookingsController.listUserBookings);
router.post("/", auth, bookingsController.createBooking);

module.exports = router;