require('dotenv').config();
const { Client } = require('pg');

async function createTable() {
    console.log("Connecting using DATABASE_URL:", process.env.DATABASE_URL);
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // Ensure enum exists
        try {
            await client.query(`
                CREATE TYPE "IngestionStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'REJECTED');
            `);
        } catch(e) { /* Enum probably exists */ }

        // Create table
        await client.query(`
            CREATE TABLE IF NOT EXISTS "IngestionListing" (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "slug" TEXT NOT NULL,
                "category" TEXT NOT NULL,
                "subcategory" TEXT,
                "city" TEXT NOT NULL,
                "district" TEXT,
                "country" TEXT NOT NULL DEFAULT 'Ethiopia',
                "lat" DOUBLE PRECISION,
                "lng" DOUBLE PRECISION,
                "address" TEXT,
                "website" TEXT,
                "phone" TEXT,
                "sourceSummary" JSONB,
                "shortDescription" TEXT,
                "longDescription" TEXT,
                "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
                "seoTitle" TEXT,
                "seoDescription" TEXT,
                "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
                "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
                "status" "IngestionStatus" NOT NULL DEFAULT 'DRAFT',
                "sourceProvenance" JSONB,
                "placeId" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,
                "lastRefreshAt" TIMESTAMP(3),

                CONSTRAINT "IngestionListing_pkey" PRIMARY KEY ("id")
            );
        `);
        
        // Add constrains and indices
        try {
            await client.query(`CREATE UNIQUE INDEX "IngestionListing_slug_key" ON "IngestionListing"("slug");`);
            await client.query(`CREATE UNIQUE INDEX "IngestionListing_placeId_key" ON "IngestionListing"("placeId");`);
            await client.query(`ALTER TABLE "IngestionListing" ADD CONSTRAINT "IngestionListing_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;`);
        } catch(e) {
            console.log("Indexes might already exist", e.message);
        }

        console.log("IngestionListing table created successfully.");
        await client.end();
    } catch (err) {
        console.error("Error creating table:", err);
        await client.end();
    }
}

createTable();
