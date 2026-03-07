export interface ImageItem {
    imageUrl: string;
    priority?: number;
    altText?: string | null;
}

export interface ImageEntity {
    images?: ImageItem[];
    auditStatus?: "ok" | "missing" | "blocked" | "broken" | null;
}

/**
 * Returns the best image URL from the entity's images array.
 * Enforces the rule that we only show verified/good images (auditStatus 'ok').
 * If missing, blocked, or no images exist, returns null (letting VerifiedImage component handle the fallback).
 */
export function getPrimaryVerifiedImage(entity: any, entityType?: string, entityId?: string): string | null {
    if (!entity) return null;

    let possibleImageUrl = null;

    if (entity.images && Array.isArray(entity.images) && entity.images.length > 0) {
        // Sort by priority if available
        const sortedImages = [...entity.images].sort((a, b) => (a.priority || 0) - (b.priority || 0));

        // Find first valid Supabase URL
        for (const img of sortedImages) {
            if (img.imageUrl && img.imageUrl.includes('supabase.co')) {
                possibleImageUrl = img.imageUrl;
                break;
            }
        }

        // If not found in supabase, try to find any image that's not Unsplash
        if (!possibleImageUrl) {
            for (const img of sortedImages) {
                if (img.imageUrl && !img.imageUrl.includes('unsplash.com') && !img.imageUrl.includes('placeholder.com') && !img.imageUrl.includes('placehold.co')) {
                    possibleImageUrl = img.imageUrl;
                    break;
                }
            }
        }
    }

    if (!possibleImageUrl && entity.image_url && typeof entity.image_url === "string") {
        possibleImageUrl = entity.image_url;
    }

    if (!possibleImageUrl) return null;

    // Reject known fake placeholders if they are the only ones left
    if (possibleImageUrl.includes("unsplash.com") || possibleImageUrl.includes("placeholder.com") || possibleImageUrl.includes("placehold.co")) {
        return null;
    }

    if (entity.auditStatus === "missing" || entity.auditStatus === "blocked" || entity.auditStatus === "broken") {
        return null; // Force fallback
    }

    return possibleImageUrl;
}
