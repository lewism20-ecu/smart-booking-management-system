const express = require(`express`);
const router = express.Router();
const { getUserProfile } = require('../services/userService.js');

async function getMe(req, res) {
  try {
    const userId = req.user.userId;
    const profile = await getUserProfile(userId);
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
module.exports = { getMe };