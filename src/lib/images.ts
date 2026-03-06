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
export function getPrimaryImage(entity: any): string | null {
    if (!entity) return null;

    let possibleImageUrl = null;

    if (entity.image_url && typeof entity.image_url === "string") {
        possibleImageUrl = entity.image_url;
    } else if (entity.images && Array.isArray(entity.images) && entity.images.length > 0) {
        // Sort by priority if available
        const sortedImages = [...entity.images].sort((a, b) => (a.priority || 0) - (b.priority || 0));
        possibleImageUrl = sortedImages[0].imageUrl;
    }

    if (!possibleImageUrl) return null;

    // Check if it's a valid Supabase storage URL, if required, but VerifiedImage helps with that.
    // Avoid unsplash / raw placeholders
    if (possibleImageUrl.includes("unsplash.com") || possibleImageUrl.includes("placeholder.com") || possibleImageUrl.includes("placehold.co")) {
        return null; // Force fallback
    }

    if (entity.auditStatus === "missing" || entity.auditStatus === "blocked" || entity.auditStatus === "broken") {
        return null; // Force fallback
    }

    return possibleImageUrl;
}
