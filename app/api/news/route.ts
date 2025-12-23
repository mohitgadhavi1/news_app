import { NextResponse } from "next/server";
import { fetchCryptoNews } from "../../../lib/mongodb";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") || "50");
        const news = await fetchCryptoNews(limit);
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
