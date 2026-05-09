import { NextResponse } from "next/server";
import { getEventById } from "@/src/db/queries/events";

// ─── CACHE CONFIGURATION ──────────────────────────────────────────────────────

const CACHE_CONTROL = "s-maxage=60, stale-while-revalidate";

// ─── GET /api/v1/events/[id] ──────────────────────────────────────────────────

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 }
      );
    }

    // Only return published events via public API
    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(event, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data event" },
      { status: 500 }
    );
  }
}
