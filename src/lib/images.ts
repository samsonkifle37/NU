export interface ImageItem {
    id?: string;
    imageUrl: string;
    mirroredUrl?: string | null;
    isMirrored?: boolean;
    status?: string;
    qualityScore?: number;
    priority?: number;
    altText?: string | null;
}

export interface ImageEntity {
    images?: ImageItem[];
    auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
}

/**
 * CDN URL helper — transforms a Supabase Storage URL to your Cloudflare CDN URL.
 *
 * Setup: set NEXT_PUBLIC_CDN_URL in .env.local once Cloudflare is in front of
 * your Supabase Storage bucket.
 *
 * Example:
 *   NEXT_PUBLIC_SUPABASE_URL  = https://hrbxtdzpseitkegkeknt.supabase.co
 *   NEXT_PUBLIC_CDN_URL       = https://images.addisview.com
 *
 *   Input:  https://hrbxtdzpseitkegkeknt.supabase.co/storage/v1/object/public/place-images/abc/0.jpg
 *   Output: https://images.addisview.com/storage/v1/object/public/place-images/abc/0.jpg
 *
 * If NEXT_PUBLIC_CDN_URL is not set, the original URL is returned unchanged.
 */
export function getCdnUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    const cdnBase = process.env.NEXT_PUBLIC_CDN_URL;
    const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!cdnBase || !supabaseBase) return url;

    // Only rewrite URLs that point to our own Supabase Storage
    if (url.startsWith(supabaseBase)) {
        return url.replace(supabaseBase, cdnBase.replace(/\/$/, ''));
    }

    return url;
}

/**
 * Returns the best image URL from the entity's images array.
 * Strictly enforces Phase 2 Validation + Mirroring hierarchy.
 * CDN-aware: routes mirrored URLs through Cloudflare if configured.
 */
export function getPrimaryVerifiedImage(entity: any, entityType?: string, entityId?: string): string | null {
    if (!entity || !entity.images || !Array.isArray(entity.images) || entity.images.length === 0) return null;

    // 1. Filter out known bad/failing images based on Pipeline
    const validImages = entity.images.filter((img: any) => img.status !== 'FAILED' && img.status !== 'REJECTED');
    if (validImages.length === 0) return null;

    // 2. Sort explicitly by TruthType (real > rep > placeholder), then Priority (0 is top), then LLM QualityScore
    const sorted = [...validImages].sort((a, b) => {
        const typeA = a.imageTruthType === 'place_real' ? 0 : (a.imageTruthType === 'representative' ? 1 : 2);
        const typeB = b.imageTruthType === 'place_real' ? 0 : (b.imageTruthType === 'representative' ? 1 : 2);
        if (typeA !== typeB) return typeA - typeB;
        if (a.priority !== b.priority) return (a.priority ?? 99) - (b.priority ?? 99);
        return (b.qualityScore || 0) - (a.qualityScore || 0);
    });

    // PASS 1: Gold standard — approved AND mirrored to our own cloud storage (route via CDN).
    for (const img of sorted) {
        if (img.status === 'APPROVED' && img.isMirrored && img.mirroredUrl) {
            return getCdnUrl(img.mirroredUrl) || img.mirroredUrl;
        }
    }

    // PASS 2: Approved by moderation but mirroring may have failed or was skipped.
    for (const img of sorted) {
        if (img.status === 'APPROVED' && img.imageUrl) {
            return getCdnUrl(img.mirroredUrl) || img.mirroredUrl || img.imageUrl;
        }
    }

    // PASS 3: Freshly ingested images that haven't passed background ETL yet.
    for (const img of sorted) {
        if (img.status === 'PENDING' && img.imageUrl) {
            return getCdnUrl(img.mirroredUrl) || img.mirroredUrl || img.imageUrl;
        }
    }

    // PASS 4: Legacy fallback for records not adhering to pipeline schemas
    for (const img of sorted) {
        if (img.imageUrl && img.imageUrl.trim() !== "") return img.imageUrl;
    }

    return null;
}
