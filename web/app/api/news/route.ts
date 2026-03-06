import { NextResponse } from "next/server";
import { fetchCryptoNews } from "@/lib/newsService";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") || "12");
        const skip = Number(url.searchParams.get("skip") || "0");
        const category = url.searchParams.get("category") || undefined;

        const { news, total } = await fetchCryptoNews(limit, skip, category);
        return NextResponse.json({ ok: true, data: news, total });
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
