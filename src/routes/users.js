const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getMe } = require("../controllers/usersController");

router.get("/me", auth, getMe);

module.exports = router;