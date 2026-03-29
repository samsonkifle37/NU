"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getPendingCandidates() {
    return await prisma.duplicateCandidate.findMany({
        where: { status: 'PENDING' },
        orderBy: { similarityScore: 'desc' }
    });
}

// Helper to manually fetch places for candidates because the relations aren't explicitly bound in schema
export async function getCandidatePlaces(masterId: string, duplicateId: string) {
    const master = await prisma.place.findUnique({ where: { id: masterId }, include: { placeSources: true } });
    const duplicate = await prisma.place.findUnique({ where: { id: duplicateId }, include: { placeSources: true } });
    return { master, duplicate };
}

export async function resolveDuplicate(candidateId: string, masterId: string, duplicateId: string, action: 'MERGE' | 'REJECT' | 'IGNORE') {
    if (action === 'MERGE') {
        // Move sources from duplicate to master
        const dupSources = await prisma.placeSource.findMany({ where: { placeId: duplicateId } });
        for (const src of dupSources) {
            try {
                await prisma.placeSource.update({
                    where: { id: src.id },
                    data: { placeId: masterId }
                });
            } catch (e) { } // Ignore if unique constraint fails
        }
        
        // Mark deleted or just hidden
        await prisma.place.update({ where: { id: duplicateId }, data: { status: 'DELETED', isActive: false } });
        
        await prisma.duplicateCandidate.update({
            where: { id: candidateId },
            data: { status: 'MERGED' }
        });
        
        await prisma.verificationLog.create({
            data: {
                placeId: masterId,
                scoreChange: 10,
                reason: "Community Deduplication Merge (+10)",
                newScore: 60 // Mock new score
            }
        });
    } else {
        await prisma.duplicateCandidate.update({
            where: { id: candidateId },
            data: { status: action === 'REJECT' ? 'REJECTED' : 'IGNORED' }
        });
    }
    
    revalidatePath('/admin/pipeline');
}

export async function getVerificationData() {
    return await prisma.place.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            placeSources: true,
            verificationLogs: true
        }
    });
}

export async function getQualityQueue() {
    return await prisma.place.findMany({
        where: {
            isActive: true,
            OR: [
                { verificationScore: { lt: 50 } },
                { placeSources: { none: {} } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
            placeSources: true,
            images: true
        }
    });
}
