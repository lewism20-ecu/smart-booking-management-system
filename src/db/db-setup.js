require("dotenv").config({ path: ".env.local" });
const { pool } = require("./index");
const { runMigrations } = require("./migrate");
const { addTestData } = require("./add-test-data");

async function setup() {
  console.log("=== Dropping existing schema ===");
  await pool.query(`
    DROP TABLE IF EXISTS reviews, bookings, resources, venue_managers, venues, users, schema_migrations CASCADE
  `);
  console.log("Schema dropped.");

  console.log("\n=== Running migrations ===");
  await runMigrations(pool);

  console.log("\n=== Seeding test data ===");
  await addTestData(pool);
}

setup()
  .then(() => {
    console.log("\nDB setup complete.");
    pool.end();
  })
  .catch((err) => {
    console.error("DB setup failed:", err.message);
    pool.end();
    process.exit(1);
  });
