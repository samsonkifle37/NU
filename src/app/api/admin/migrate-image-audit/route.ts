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

            // Create ImageAudit table
            await client.query(`
                CREATE TABLE IF NOT EXISTS "ImageAudit" (
                    "id" TEXT NOT NULL,
                    "entityType" TEXT NOT NULL,
                    "entityId" TEXT NOT NULL,
                    "name" TEXT NOT NULL,
                    "imageUrl" TEXT,
                    "status" TEXT NOT NULL DEFAULT 'pending',
                    "httpCode" INTEGER,
                    "notes" TEXT,
                    "source" TEXT,
                    "sourcePageUrl" TEXT,
                    "dimensions" TEXT,
                    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "verifiedAt" TIMESTAMP(3),
                    CONSTRAINT "ImageAudit_pkey" PRIMARY KEY ("id")
                );
            `);

            // Add indexes manually since we're using raw SQL
            await client.query(`CREATE INDEX IF NOT EXISTS "ImageAudit_status_idx" ON "ImageAudit"("status");`);
            await client.query(`CREATE INDEX IF NOT EXISTS "ImageAudit_entity_idx" ON "ImageAudit"("entityType", "entityId");`);

            await client.query("COMMIT");
            return NextResponse.json({ success: true, message: "ImageAudit migration applied successfully" });
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
