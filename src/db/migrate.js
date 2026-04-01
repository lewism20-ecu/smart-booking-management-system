require("dotenv").config({ path: process.env.ENV_FILE || ".env.local" });
const fs = require("fs");
const path = require("path");
const { pool } = require("./index");

async function runMigrations(db) {
  // Tracking table — records which migration files have been applied
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const dir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows } = await db.query("SELECT filename FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.filename));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping (already applied): ${file}`);
      continue;
    }
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await db.query(sql);
    await db.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [
      file,
    ]);
    console.log(`Completed: ${file}`);
    count++;
  }

  console.log(
    count === 0 ? "No new migrations." : `${count} migration(s) complete.`,
  );
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations(pool)
    .then(() => pool.end())
    .catch((err) => {
      console.error("Migration failed:", err.message);
      process.exit(1);
    });
}
