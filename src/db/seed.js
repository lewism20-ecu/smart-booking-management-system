require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { pool } = require('./index');

async function runSeeds() {
  const dir   = path.join(__dirname, 'seeds');
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`Running seed: ${file}`);
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await pool.query(sql);
    console.log(`Completed: ${file}`);
  }

  console.log('All seeds complete.');
  await pool.end();
}

runSeeds().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
