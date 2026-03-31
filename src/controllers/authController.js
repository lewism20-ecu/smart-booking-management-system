const bcrypt    = require('bcrypt');
const { signToken } = require('../utils/jwt');
const userModel = require('../models/userModel');

/**
 * POST /auth/signup
 * Creates a new user account
 */
exports.signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Email and password are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Invalid email format.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Password must be at least 8 characters.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.createUser(email, hashedPassword);

    res.status(201).json(user);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already exists.'
      });
    }
    next(err);
  }
};

/**
 * POST /auth/login
 * Authenticates a user and returns a JWT
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Email and password are required.'
      });
    }

    const user = await userModel.findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials.'
      });
    }

    const token = signToken({
      userId: user.user_id,
      role:   user.role
    });

    res.json({
      token,
      user: {
        userId: user.user_id,
        email:  user.email,
        role:   user.role
      }
    });
  } catch (err) {
    next(err);
  }
};
