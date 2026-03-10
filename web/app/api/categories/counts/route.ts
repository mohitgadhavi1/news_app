import { NextResponse } from "next/server";
import { fetchCategoryCounts } from "@/lib/newsService";

/**
 * Cache category counts for 10 minutes (600 seconds).
 * This reduces the frequency of expensive MongoDB aggregations for side navigation.
 */
export const revalidate = 600;

export async function GET() {
    try {
        const counts = await fetchCategoryCounts();
        return NextResponse.json(counts);
    } catch (error) {
        console.error("Failed to fetch category counts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
