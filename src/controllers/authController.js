const pool = require("../db");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");

async function signup(req, res) {
    const { email, password } = req.body;

    const hashed = await hashPassword(password);

    const result = await pool.query(
        "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING user_id, email, role",
        [email, hashed, "user"]
    );

    res.status(201).json({
        userId: result.rows[0].user_id,
        email: result.rows[0].email,
        role: result.rows[0].role,
    });
}

async function login(req, res) {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid credentials."});
    }

    const user = result.rows[0];
    const match = await comparePassword(password, user.password);
    if (!match) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid credentials."});
    }

    const token = signToken({ userId: user.user_id, role: user.role });

    res.json({
        token,
        user: {
            userId: user.user_id,
            email: user.email,
            role: user.role,
        },
    });
}

module.exports = { signup, login };