const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getMe } = require("../controllers/usersController");

// Any authenticated user can view their own profile
router.get("/me", auth, getMe);

module.exports = router;