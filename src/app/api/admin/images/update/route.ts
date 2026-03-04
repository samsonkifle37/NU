import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const { id, imageUrl } = await req.json();

        // 1. Update the actual data
        // For places, we update the PlaceImage table. 
        // We find the first image for this place or create one.
        const existingImage = await prisma.placeImage.findFirst({
            where: { placeId: id }
        });

        if (existingImage) {
            await prisma.placeImage.update({
                where: { id: existingImage.id },
                data: { imageUrl }
            });
        } else {
            await prisma.placeImage.create({
                data: {
                    placeId: id,
                    imageUrl,
                    priority: 0
                }
            });
        }

        // 2. Perform a quick validation
        let status = 'ok';
        let httpCode = 200;
        let notes = '';

        try {
            const res = await axios.head(imageUrl, { timeout: 3000 });
            httpCode = res.status;
        } catch (e: any) {
            status = 'broken';
            httpCode = e.response?.status || 500;
            notes = e.message;
        }

        // 3. Update Audit table
        await prisma.imageAudit.update({
            where: { id },
            data: {
                imageUrl,
                status,
                httpCode: httpCode,
                notes: notes || null,
                checkedAt: new Date(),
                verifiedAt: status === 'ok' ? new Date() : null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
