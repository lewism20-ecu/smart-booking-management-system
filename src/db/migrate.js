require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { pool } = require('./index');

async function runMigrations() {
  const dir   = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    console.log(`Completed: ${file}`);
  }

  console.log('All migrations complete.');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
