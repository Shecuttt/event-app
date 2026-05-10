import { NextResponse } from "next/server";
import { requireRole } from "@/src/lib/auth";
import { getOrganizerEvents } from "@/src/db/queries/events";

// ─── CACHE CONFIGURATION ──────────────────────────────────────────────────────

const CACHE_CONTROL = "private, no-store";

// ─── GET /api/v1/organizer/events ───────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // 1. Auth required, role organizer
    const session = await requireRole("organizer");
    const organizerId = session.user.id;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);
    const status = searchParams.get("status") as "draft" | "published" | "archived" | undefined;
    const search = searchParams.get("search") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const locationType = (searchParams.get("locationType") as "offline" | "online") ?? undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const sort = (searchParams.get("sort") as "startAt_asc" | "startAt_desc" | "createdAt_desc") ?? "createdAt_desc";

    // Validate pagination params
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    const result = await getOrganizerEvents(organizerId, {
      page: validatedPage,
      limit: validatedLimit,
      search,
      category,
      locationType,
      dateFrom,
      dateTo,
      sort,
    });

    // Filter by status if specified (client-side since getOrganizerEvents returns all)
    if (status && result.events) {
      result.events = result.events.filter((event) => event.status === status);
      result.total = result.events.length;
      result.totalPages = Math.ceil(result.total / validatedLimit);
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    if (error instanceof Error && error.message.startsWith("Unauthorized")) {
      return NextResponse.json(
        { error: "Unauthorized - Anda harus login" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return NextResponse.json(
        { error: "Forbidden - Hanya organizer yang dapat mengakses" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Gagal mengambil data event" },
      { status: 500 }
    );
  }
}
