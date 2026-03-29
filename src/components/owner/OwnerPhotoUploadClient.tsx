"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { OwnerPhotoUpload } from "@/components/owner/OwnerPhotoUpload";
import { Loader2 } from "lucide-react";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function OwnerPhotoUploadClient({
    placeId,
    placeName
}: {
    placeId: string;
    placeName: string;
}) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setToken(session?.access_token || null);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!token) {
        return (
            <div className="text-center py-10 text-sm text-gray-500">
                Session expired — please <a href="/auth" className="font-bold text-gray-900 underline">sign in again</a>.
            </div>
        );
    }

    return <OwnerPhotoUpload placeId={placeId} placeName={placeName} authToken={token} />;
}
