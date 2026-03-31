const { resourceExists, hasOverlap, createBooking } = require("../services/bookingService");
const { getBookingsForUser } = require("../services/bookingService");

async function createBookingController(req, res) {
  try {
    const userId = req.user.userId;
    const { resourceId, startTime, endTime } = req.body;

    // validate required fields
    if (!resourceId || !startTime || !endTime) {
      return res.status(400).json({error: "Missing required fields" });
    }

    //validate time window
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ error: "startTime must be before endTime" });
    }

    // check resource exists
    const resource = await resourceExists(resourceId);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // check for overlapping bookings
    const overlap = await hasOverlap(resourceId, startTime, endTime);
    if (overlap) {
      return res.status(409).json({ error: "Resource already booked for this time window"});
    }

    // determine status
    const status = resource.approval_required ? "pending" : "approved";

    // insert booking
    const booking = await createBooking(
      userId,
      resourceId,
      startTime,
      endTime,
      status
    );

    return res.status(201).json(booking);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
}

async function getBookings(req, res) {
  try {
    const userId = req.user.userId;
    const bookings = await getBookingsForUser(userId);
    res.status(200).json({ bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
}



module.exports = { createBookingController, getBookings };