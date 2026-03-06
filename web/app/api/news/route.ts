import { NextResponse } from "next/server";
import { fetchCryptoNews } from "@/lib/newsService";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        // ✅ Security: Validate limit to prevent DoS via large requests
        const limitParam = url.searchParams.get("limit");
        const parsedLimit = limitParam ? parseInt(limitParam, 10) : 50;
        const validatedLimit = isNaN(parsedLimit) || parsedLimit <= 0 ? 50 : Math.min(parsedLimit, 100);

        const news = await fetchCryptoNews(validatedLimit);
        return NextResponse.json({ ok: true, data: news });
    } catch (err) {  // implicitly 'unknown' in modern TS
        let errorMessage = "An unexpected error occurred";

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === "string") {
            errorMessage = err;
        }

        return NextResponse.json({
            ok: false,
            error: errorMessage
        }, { status: 500 });
    }
}
