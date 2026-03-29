import { getIngestionListings } from './actions';
import FoundryClient from './FoundryClient';

export const metadata = { title: "Listing Foundry - Admin" };

export default async function FoundryPage({ searchParams }: { searchParams: Promise<{ status?: string, city?: string }> }) {
    const resolvedParams = await searchParams;
    const listings = await getIngestionListings({
        status: resolvedParams.status as any,
        city: resolvedParams.city
    });

    return (
        <div className="container mx-auto py-8 text-black px-4 dark:text-white">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Listing Foundry</h1>
                <div className="text-sm text-gray-500">
                    Pipeline: OpenStreetMap → Deduplicate → LLM Enrichment → Unsplash/Images → NU DB
                </div>
            </div>
            <FoundryClient initialListings={listings} />
        </div>
    );
}
