import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function mirrorImage(imageUrl: string, folder: string, filename: string) {
    if (!supabase) {
        throw new Error("Supabase credentials missing. Mirroring failed.");
    }

    try {
        // 1. Download image
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'AddisViewImageValidator/1.0 (contact: admin@addisview.app)',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': 'https://addisview.vercel.app'
            }
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        const buffer = Buffer.from(response.data);

        // 2. Upload to Supabase Storage
        const path = `${folder}/${filename}.${contentType.split('/')[1] || 'jpg'}`;
        const { data, error } = await supabase.storage
            .from('public-images')
            .upload(path, buffer, {
                contentType,
                upsert: true
            });

        if (error) throw error;

        // 3. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('public-images')
            .getPublicUrl(path);

        return publicUrl;
    } catch (e) {
        console.error("Mirroring error:", e);
        throw e;
    }
}
