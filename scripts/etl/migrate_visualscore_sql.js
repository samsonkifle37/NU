const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateVisualScore() {
  console.log("Starting raw SQL migration for Place visualScore...");
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`ALTER TABLE "Place" ADD COLUMN IF NOT EXISTS "visualScore" INTEGER NOT NULL DEFAULT 0`);
    await client.query('COMMIT');
    console.log("Migration completed successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", e);
  } finally {
    client.release();
    pool.end();
  }
}

migrateVisualScore();
