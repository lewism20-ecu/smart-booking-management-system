const express = require("express");
const router = express.Router();
const { signToken } = require("../utils/jwt");

router.get("/token", (req, res) => {
    const token = signToken({
        userId: 1,
        role: "user"
    });

    res.json({ token });
});

module.exports = router;