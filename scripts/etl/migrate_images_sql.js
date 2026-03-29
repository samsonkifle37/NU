const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateImages() {
  console.log("Starting raw SQL migration for PlaceImage Phase 2...");
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Add fields to PlaceImage
    console.log("Altering PlaceImage table...");
    await client.query(`
      ALTER TABLE "PlaceImage" 
      ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "qualityScore" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "isMirrored" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "mirroredUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "width" INTEGER,
      ADD COLUMN IF NOT EXISTS "height" INTEGER,
      ADD COLUMN IF NOT EXISTS "hash" TEXT,
      ADD COLUMN IF NOT EXISTS "labels" TEXT[] DEFAULT ARRAY[]::TEXT[],
      ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT
    `);

    // Add unique index on hash to prevent duplicate image ingestion
    try {
        await client.query(`CREATE INDEX "PlaceImage_hash_idx" ON "PlaceImage"("hash");`);
    } catch(e) {}

    await client.query('COMMIT');
    console.log("Image Pipeline Migration completed successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", e);
  } finally {
    client.release();
    pool.end();
  }
}

migrateImages();
