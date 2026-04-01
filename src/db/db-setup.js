require("dotenv").config({ path: process.env.ENV_FILE || ".env.local" });
const { pool } = require("./index");
const { runMigrations } = require("./migrate");
const { addTestData } = require("./add-test-data");

async function waitForDatabase(maxAttempts = 20, delayMs = 1500) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query("SELECT 1");
      if (attempt > 1) {
        console.log(`Database became available on attempt ${attempt}.`);
      }
      return;
    } catch (err) {
      const isLastAttempt = attempt === maxAttempts;
      const message = err && err.message ? err.message : "Unknown error";

      if (isLastAttempt) {
        throw new Error(
          `Unable to connect to database after ${maxAttempts} attempts: ${message}`,
        );
      }

      console.log(
        `Waiting for database (${attempt}/${maxAttempts}): ${message}`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function setup() {
  await waitForDatabase();

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
