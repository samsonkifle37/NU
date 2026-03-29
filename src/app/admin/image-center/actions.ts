"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
// Reuse the pipeline engine if we want to explicitly retry the fetch
import crypto from 'crypto';
import sizeOf from 'image-size';
import axios from 'axios';
import { mirrorImage } from "@/lib/supabase-storage";

export async function getPipelineImages(filter: 'ALL'|'PENDING'|'FAILED') {
    return await prisma.placeImage.findMany({
        where: filter === 'ALL' ? {} : { status: filter },
        include: { place: { select: { name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50
    });
}

export async function getPipelineStats() {
    const raw = await prisma.placeImage.groupBy({
        by: ['status'],
        _count: { id: true }
    });
    
    const mirroredCount = await prisma.placeImage.count({ where: { isMirrored: true } });
    const totalCount = await prisma.placeImage.count();

    const lastRun = await prisma.placeImage.findFirst({
        where: { verifiedAt: { not: null } },
        orderBy: { verifiedAt: 'desc' },
        select: { verifiedAt: true }
    });
    
    return {
        groups: raw,
        mirroredCount,
        totalCount,
        lastRunAt: lastRun?.verifiedAt ? lastRun.verifiedAt.toISOString() : null
    }
}

export async function updateImageState(id: string, action: 'APPROVE' | 'REJECT' | 'SET_PRIMARY' | 'RETRY', newUrl?: string) {
    if (action === 'REJECT') {
        await prisma.placeImage.update({
            where: { id },
            data: { status: 'FAILED', rejectionReason: 'Admin Manual Rejection' }
        });
    }

    if (action === 'APPROVE') {
        const img = await prisma.placeImage.findUnique({ where: { id }});
        await prisma.placeImage.update({
            where: { id },
            data: { status: 'APPROVED', qualityScore: Math.max(img?.qualityScore || 0, 50) }
        });
    }

    if (action === 'SET_PRIMARY') {
        const img = await prisma.placeImage.findUnique({ where: { id }});
        if (img) {
            // Unset current primary
            await prisma.placeImage.updateMany({
                where: { placeId: img.placeId, priority: 0 },
                data: { priority: 1 }
            });
            // Set new primary
            await prisma.placeImage.update({
                where: { id },
                data: { priority: 0, status: 'APPROVED' }
            });
        }
    }

    if (newUrl) {
         await prisma.placeImage.update({
             where: { id },
             data: { imageUrl: newUrl, status: 'PENDING', isMirrored: false, verificationScore: 0 } as any
         });
         // The background ETL bucket script will pick this up automatically!
    }

    revalidatePath('/admin/image-center');
}
