const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log("Starting raw SQL migration over 6543 pooler...");
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Add fields to Place
    console.log("Altering Place table...");
    await client.query(`
      ALTER TABLE "Place" 
      ADD COLUMN IF NOT EXISTS "verificationLevel" INTEGER NOT NULL DEFAULT 30,
      ADD COLUMN IF NOT EXISTS "verificationScore" INTEGER NOT NULL DEFAULT 30,
      ADD COLUMN IF NOT EXISTS "claimable" BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "brandName" TEXT,
      ADD COLUMN IF NOT EXISTS "subcategory" TEXT,
      ADD COLUMN IF NOT EXISTS "district" TEXT,
      ADD COLUMN IF NOT EXISTS "fullAddress" TEXT,
      ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
      ADD COLUMN IF NOT EXISTS "openingHours" JSONB,
      ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'ETB',
      ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "sourceCount" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "bookingLink" TEXT,
      ADD COLUMN IF NOT EXISTS "socialLinks" JSONB,
      ADD COLUMN IF NOT EXISTS "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
      ADD COLUMN IF NOT EXISTS "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
      ADD COLUMN IF NOT EXISTS "lastCheckedAt" TIMESTAMP(3)
    `);

    // 2. Create PlaceSource table
    console.log("Creating PlaceSource table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PlaceSource" (
          "id" TEXT NOT NULL,
          "placeId" TEXT NOT NULL,
          "url" TEXT NOT NULL,
          "sourceName" TEXT NOT NULL,
          "sourceType" TEXT NOT NULL,
          "rawJson" JSONB,
          "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PlaceSource_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "PlaceSource_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    // Add unique constraint to PlaceSource safely
    try {
        await client.query(`CREATE UNIQUE INDEX "PlaceSource_placeId_url_key" ON "PlaceSource"("placeId", "url");`);
    } catch(e) {}

    // 3. Create VerificationLog table
    console.log("Creating VerificationLog table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "VerificationLog" (
          "id" TEXT NOT NULL,
          "placeId" TEXT NOT NULL,
          "scoreChange" INTEGER NOT NULL,
          "reason" TEXT NOT NULL,
          "newScore" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "VerificationLog_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 4. Create DuplicateCandidate table
    console.log("Creating DuplicateCandidate table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DuplicateCandidate" (
          "id" TEXT NOT NULL,
          "masterPlaceId" TEXT NOT NULL,
          "duplicateId" TEXT NOT NULL,
          "similarityScore" INTEGER NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DuplicateCandidate_pkey" PRIMARY KEY ("id")
      );
    `);

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

migrate();
