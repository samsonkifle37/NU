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

            // Add new columns to PlaceImage
            await client.query(`
                ALTER TABLE "PlaceImage" 
                ADD COLUMN IF NOT EXISTS "imageSource" TEXT,
                ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
            `);

            await client.query("COMMIT");
            return NextResponse.json({ success: true, message: "PlaceImage traceability migration applied successfully" });
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
