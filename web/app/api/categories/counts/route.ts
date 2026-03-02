import { NextResponse } from "next/server";
import { fetchCategoryCounts } from "@/lib/newsService";

export async function GET() {
    try {
        const counts = await fetchCategoryCounts();
        return NextResponse.json(counts);
    } catch (error) {
        console.error("Failed to fetch category counts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
