import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { getCdnUrl } from './images';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

/**
 * Downloads an image from a remote URL and uploads it to Supabase Storage.
 * Returns the CDN URL if NEXT_PUBLIC_CDN_URL is configured, otherwise the
 * raw Supabase Storage public URL.
 */
export async function mirrorImage(imageUrl: string, folder: string, filename: string): Promise<string> {
    if (!supabase) {
        throw new Error("Supabase credentials missing. Mirroring failed.");
    }

    try {
        // 1. Download image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'AddisViewImageBot/1.0 (contact: admin@addisview.com)',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': 'https://addisview.com'
            },
            timeout: 15000
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
        const buffer = Buffer.from(response.data);

        // 2. Upload to Supabase Storage
        const path = `${folder}/${filename}.${ext}`;
        const { error } = await supabase.storage
            .from('place-images')
            .upload(path, buffer, {
                contentType,
                upsert: true,
                cacheControl: '31536000' // 1 year — Cloudflare will respect this
            });

        if (error) throw error;

        // 3. Get public URL and apply CDN rewrite if configured
        const { data: { publicUrl } } = supabase.storage
            .from('place-images')
            .getPublicUrl(path);

        return getCdnUrl(publicUrl) || publicUrl;
    } catch (e) {
        console.error("Mirroring error:", e);
        throw e;
    }
}

/**
 * Deletes an image from Supabase Storage.
 */
export async function deleteStorageImage(path: string): Promise<void> {
    if (!supabase) throw new Error("Supabase credentials missing.");
    const { error } = await supabase.storage.from('place-images').remove([path]);
    if (error) throw error;
}

/**
 * Gets a CDN-aware public URL for a storage path.
 */
export function getStorageUrl(path: string): string {
    if (!supabase) return '';
    const { data: { publicUrl } } = supabase.storage
        .from('place-images')
        .getPublicUrl(path);
    return getCdnUrl(publicUrl) || publicUrl;
}
