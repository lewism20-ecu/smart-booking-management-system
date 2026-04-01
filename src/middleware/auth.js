const { verifyToken } = require("../utils/jwt");

function authMiddleware(req, res, next) {
  
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized", message: "Missing token"});
    }

    const token = header.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: "Unauthorized", message: "Invalid token "});
    }
}


module.exports = authMiddleware;