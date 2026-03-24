const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const usersController = require("../controllers/usersController");

router.get("/me", auth, usersController.getMe);

module.exports = router;