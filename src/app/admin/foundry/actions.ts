'use server';

import { prisma } from '@/lib/prisma';
import { IngestionStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getIngestionListings(filters: { status?: IngestionStatus, city?: string, category?: string } = {}) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.city) where.city = filters.city;
    if (filters.category) where.category = filters.category;

    const listings = await prisma.ingestionListing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
    });

    return listings;
}

export async function approveListing(id: string) {
    await prisma.ingestionListing.update({
        where: { id },
        data: { status: IngestionStatus.PUBLISHED }
    });

    // Here we would sync with Place table
    const listing = await prisma.ingestionListing.findUnique({ where: { id } });

    if (listing && !listing.placeId) {
        const place = await prisma.place.create({
            data: {
                name: listing.name,
                slug: listing.slug,
                type: listing.category.toLowerCase(), // map type
                city: listing.city,
                country: listing.country,
                latitude: listing.lat,
                longitude: listing.lng,
                neighborhood: listing.address || '',
                area: listing.district || '',
                shortDescription: listing.shortDescription,
                longDescription: listing.longDescription,
                websiteUrl: listing.website,
                phone: listing.phone,
                tags: listing.tags,
                source: 'foundry-ingestion',
                status: 'APPROVED',
                isActive: true,
            }
        });

        if (listing.imageUrls && listing.imageUrls.length > 0) {
            await prisma.placeImage.createMany({
                data: listing.imageUrls.map((url, i) => ({
                    placeId: place.id,
                    imageUrl: url,
                    priority: i,
                    imageSource: 'foundry-resolved'
                }))
            });
        }

        await prisma.ingestionListing.update({
            where: { id },
            data: { placeId: place.id }
        });
    }

    revalidatePath('/admin/foundry');
}

export async function rejectListing(id: string) {
    await prisma.ingestionListing.update({
        where: { id },
        data: { status: IngestionStatus.REJECTED }
    });
    revalidatePath('/admin/foundry');
}

export async function rerunImageLookup(id: string) {
    // We'd push to BullMQ in a real queue. For Server Action we can just update a field.
    // Using an API request to worker could also be an option.
    await prisma.ingestionListing.update({
        where: { id },
        data: { status: IngestionStatus.REVIEW, confidenceScore: { increment: 0.1 } } // trigger review
    });
    revalidatePath('/admin/foundry');
}

export async function bulkPublish(ids: string[]) {
    for (const id of ids) {
        await approveListing(id);
    }
}
