const { getBookingsForUser } = require("../services/bookingService");

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

module.exports = { getBookings };