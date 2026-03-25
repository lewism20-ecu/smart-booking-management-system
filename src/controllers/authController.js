const pool = require("../db/db");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/jwt");
const { isStrongPassword } = require("../utils/validation");

async function signup(req, res) {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Email and password are required."
            });
        }

        // Validate password strength
        if (!isStrongPassword(password)) {
            return res.status(400).json({
                error: "Weak password",
                message:
                    "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol."
            });
        }

        // Check if email already exists
        const existing = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                error: "Conflict",
                message: "Email already exists."
            });
        }

        // Hash password
        const hashed = await hashPassword(password);

        // Insert user
        const result = await pool.query(
            "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING user_id, email, role",
            [email, hashed, "user"]
        );

        const user = result.rows[0];

        // Generate JWT
        const token = signToken({
            userId: user.user_id,
            role: user.role
        });

        return res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                userId: user.user_id,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        // Handle duplicate key error (Postgres code 23505)
        if (err.code === "23505") {
            return res.status(409).json({
                error: "Conflict",
                message: "Email already exists."
            });
        }

        console.error("Signup error:", err);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Something went wrong during signup."
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: "Bad Request",
                message: "Email and password are required."
            });
        }

        // Look up user
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Invalid credentials."
            });
        }

        const user = result.rows[0];

        // Compare password
        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Invalid credentials."
            });
        }

        // Generate JWT
        const token = signToken({
            userId: user.user_id,
            role: user.role
        });

        return res.json({
            message: "Login successful",
            token,
            user: {
                userId: user.user_id,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Something went wrong during login."
        });
    }
}

module.exports = { signup, login };