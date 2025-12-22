import { NextResponse } from "next/server";
import { fetchCryptoNews } from "../../../lib/mongodb";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit") || "50");
        const news = await fetchCryptoNews(limit);
        return NextResponse.json({ ok: true, data: news });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }
}
