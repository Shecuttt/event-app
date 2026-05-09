import { NextResponse } from "next/server";
import { getPublishedEvents } from "@/src/db/queries/events";

// ─── CACHE CONFIGURATION ──────────────────────────────────────────────────────

const CACHE_CONTROL = "s-maxage=60, stale-while-revalidate";

// ─── GET /api/v1/events ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query params
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);
    const search = searchParams.get("search") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const locationType = (searchParams.get("locationType") as "offline" | "online") ?? undefined;
    const type = (searchParams.get("type") as "free" | "paid") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const sort = (searchParams.get("sort") as "startAt_asc" | "startAt_desc" | "createdAt_desc") ?? "startAt_asc";

    // Validate pagination params
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    const result = await getPublishedEvents({
      page: validatedPage,
      limit: validatedLimit,
      search,
      category,
      locationType,
      type,
      dateFrom,
      dateTo,
      sort,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data event" },
      { status: 500 }
    );
  }
}
