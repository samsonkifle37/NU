import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";
import { getCdnUrl } from "@/lib/images";

// Service-role Supabase client for storage uploads
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

const BUCKET = "place-images";
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_PHOTOS_PER_PLACE = 20;

export async function POST(request: NextRequest) {
    try {
        // 1. Auth check — must be logged in
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ).auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // 2. Parse form data
        const formData = await request.formData();
        const placeId = formData.get("placeId") as string;
        const files = formData.getAll("photos") as File[];

        if (!placeId || files.length === 0) {
            return NextResponse.json({ error: "placeId and at least one photo required" }, { status: 400 });
        }

        // 3. Verify user has an APPROVED claim on this place
        const claim = await prisma.ownerClaim.findFirst({
            where: { placeId, userId: user.id, status: "APPROVED" }
        });
        if (!claim) {
            return NextResponse.json(
                { error: "No approved claim found for this place" },
                { status: 403 }
            );
        }

        // 4. Count existing owner photos to enforce limit
        const existingCount = await prisma.placeImage.count({
            where: { placeId, imageSource: "owner_upload" }
        });
        if (existingCount + files.length > MAX_PHOTOS_PER_PLACE) {
            return NextResponse.json(
                { error: `Max ${MAX_PHOTOS_PER_PLACE} owner photos per place. Currently: ${existingCount}` },
                { status: 400 }
            );
        }

        // 5. Validate and upload each file
        const uploaded: { url: string; id: string }[] = [];
        const errors: string[] = [];

        for (const file of files.slice(0, 10)) { // cap at 10 per request
            // Validate
            if (!ALLOWED_TYPES.includes(file.type)) {
                errors.push(`${file.name}: unsupported type (use JPEG, PNG, WebP, or AVIF)`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`${file.name}: too large (max 8 MB)`);
                continue;
            }

            // Upload to Supabase Storage
            const ext = file.type.split("/")[1].replace("jpeg", "jpg");
            const path = `${placeId}/owner_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
            const buffer = Buffer.from(await file.arrayBuffer());

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(path, buffer, {
                    contentType: file.type,
                    upsert: false,
                    cacheControl: "31536000"
                });

            if (uploadError) {
                errors.push(`${file.name}: upload failed — ${uploadError.message}`);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(path);

            const cdnUrl = getCdnUrl(publicUrl) || publicUrl;

            // Insert PlaceImage record (status PENDING — admin approves)
            const image = await prisma.placeImage.create({
                data: {
                    placeId,
                    imageUrl:       cdnUrl,
                    mirroredUrl:    cdnUrl,
                    imageSource:    "owner_upload",
                    altText:        `${claim.fullName}'s photo`,
                    priority:       10, // de-prioritise vs. editorial photos
                    status:         "PENDING",
                    isMirrored:     true,
                    qualityScore:   70,
                    imageTruthType: "place_real"
                }
            });

            uploaded.push({ url: cdnUrl, id: image.id });
        }

        return NextResponse.json({
            uploaded,
            errors,
            message: `${uploaded.length} photo(s) submitted for review.`
        });

    } catch (err) {
        console.error("Owner photo upload error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET — list this owner's uploaded photos for a place
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const placeId = searchParams.get("placeId");

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice(7);
        const { data: { user }, error: authError } = await createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        ).auth.getUser(token);

        if (authError || !user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        if (!placeId) return NextResponse.json({ error: "placeId required" }, { status: 400 });

        const claim = await prisma.ownerClaim.findFirst({
            where: { placeId, userId: user.id, status: "APPROVED" }
        });
        if (!claim) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const images = await prisma.placeImage.findMany({
            where: { placeId, imageSource: "owner_upload" },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ images });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
