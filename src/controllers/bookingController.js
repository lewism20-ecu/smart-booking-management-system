exports.listUserBookings = (req, res) => {
  res.json({
    message: "bookingController.listUserBookings is working",
    user: req.user
  });
};

exports.createBooking = (req, res) => {
  res.json({
    message: "bookingController.createBooking is working",
    body: req.body,
    user: req.user
  });
};