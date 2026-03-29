import { PrismaClient } from '@prisma/client';
import { prisma } from '../src/lib/prisma'; // Using application's prisma instance to ensure correctness

async function clean() {
    console.log("Cleaning all existing Places and IngestionListings...");
    
    // First, wipe the Place table completely.
    // Also PlaceImage, PlaceReview etc are cascaded or we delete manual.
    try {
        await prisma.review.deleteMany({});
        await prisma.placeImage.deleteMany({});
        await prisma.favorite.deleteMany({});
        
        const resPlaces = await prisma.place.deleteMany({});
        console.log(`Deleted ${resPlaces.count} Places.`);

        const resIngestion = await prisma.ingestionListing.deleteMany({});
        console.log(`Deleted ${resIngestion.count} IngestionListings.`);

        console.log("Database reset successfully.");
    } catch (e) {
        console.error("Error during reset:", e);
    }
}

clean();
