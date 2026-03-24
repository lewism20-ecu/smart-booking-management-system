exports.getMe = (req, res) => {
  res.json({
    message: "usersController.getMe is working",
    user: req.user
  });
};