
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) return new NextResponse("Missing URL", { status: 400 });

    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            headers: {
                "User-Agent": "NU-Proxy/1.0",
                "Referer": "https://nu.app"
            }
        });

        const contentType = response.headers["content-type"];
        return new NextResponse(response.data, {
            headers: {
                "Content-Type": contentType || "image/jpeg",
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
                "Access-Control-Allow-Origin": "*",
            }
        });
    } catch (e: any) {
        console.error("Proxy error:", e.message);
        return new NextResponse(`Failed to fetch image: ${e.message}`, { status: 500 });
    }
}
