const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");

// POST /auth/signup
router.post("/signup", signup);

// POST /auth/login
router.post("/login", login);

module.exports = router;