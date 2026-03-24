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
    } catch (err) {
        console.error("News API Error:", err);
        return NextResponse.json({
            ok: false,
            error: "Internal Server Error"
        }, { status: 500 });
    }
}
