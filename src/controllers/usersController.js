const userModel = require('../models/userModel');

exports.getMe = async (req, res, next) => {
  try {
    const user = await userModel.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'User not found.'
      });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};
