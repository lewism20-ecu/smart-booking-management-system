require('dotenv').config({ path: process.env.ENV_FILE || ".env.local" });
const { Pool } = require("pg");

function getSslConfig() {
  const sslMode = (process.env.DB_SSL || "").toLowerCase();

  if (sslMode === "false" || sslMode === "disable" || sslMode === "off") {
    return false;
  }

  if (sslMode === "true" || sslMode === "require" || sslMode === "on") {
    return { rejectUnauthorized: false };
  }

  // Keep current behavior unless DB_SSL is explicitly set.
  return process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false;
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: getSslConfig(),
});

module.exports = { pool };
