import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST() {
    try {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Add new columns to Place table
            await client.query(`
                ALTER TABLE "Place" 
                ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT,
                ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'APPROVED',
                ADD COLUMN IF NOT EXISTS "priceLevel" TEXT,
                ADD COLUMN IF NOT EXISTS "neighborhood" TEXT,
                ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT false;
            `);

            // Create PlaceImageError table
            await client.query(`
                CREATE TABLE IF NOT EXISTS "PlaceImageError" (
                    "id" TEXT NOT NULL,
                    "placeId" TEXT NOT NULL,
                    "imageUrl" TEXT NOT NULL,
                    "errorType" TEXT NOT NULL DEFAULT '404',
                    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "PlaceImageError_pkey" PRIMARY KEY ("id")
                );
            `);

            // Add foreign key constraint
            await client.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlaceImageError_placeId_fkey') THEN
                        ALTER TABLE "PlaceImageError" ADD CONSTRAINT "PlaceImageError_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                    END IF;
                END $$;
            `);

            await client.query("COMMIT");
            return NextResponse.json({ success: true, message: "Migration applied successfully" });
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
            await pool.end();
        }
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
