import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        const adminSecret = process.env.ADMIN_SEED_SECRET;

        if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { batchFile } = await req.json(); // e.g. "sourced_images_batch_1_2.json"

        // Use an absolute path for safety
        const filePath = path.join(process.cwd(), 'tmp', batchFile);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: "Batch file not found", path: filePath }, { status: 404 });
        }

        const rawData = fs.readFileSync(filePath, 'utf8');
        const items = JSON.parse(rawData);

        const results = [];
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        for (const item of items) {
            try {
                // Call the internal update API to handle mirroring and DB updates
                const response = await fetch(`${baseUrl}/api/admin/images/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminSecret}`
                    },
                    body: JSON.stringify({
                        id: item.id,
                        imageUrl: item.imageUrl,
                        source: item.source,
                        sourcePageUrl: item.sourcePageUrl
                    })
                });

                const data = await response.json();
                results.push({ name: item.name, success: response.ok, data });
            } catch (itemError) {
                results.push({ name: item.name, success: false, error: String(itemError) });
            }
        }

        return NextResponse.json({
            success: true,
            total: items.length,
            results
        });
    } catch (error) {
        console.error("Bulk Process error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
