const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.get("/protected", auth, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        user: req.user
    });
});

module.exports = router;