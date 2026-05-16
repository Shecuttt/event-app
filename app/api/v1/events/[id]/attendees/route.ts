import { NextResponse } from "next/server";
import { requireAuth, requireEventOwner } from "@/src/lib/auth";
import { getAttendeesByEvent } from "@/src/db/queries/registrations";

// ─── CACHE CONFIGURATION ──────────────────────────────────────────────────────

const CACHE_CONTROL = "private, no-store";

// ─── GET /api/v1/events/[id]/attendees ──────────────────────────────────────────

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 1. Auth required
    const session = await requireAuth();
    const organizerId = session.user.id;

    const { id } = await params;

    // 2. Verify event exists and belongs to the organizer
    await requireEventOwner(id, organizerId);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);
    const status = searchParams.get("status") as "registered" | "checked_in" | "absent" | undefined;

    // Validate pagination params
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    const result = await getAttendeesByEvent(id, {
      page: validatedPage,
      limit: validatedLimit,
      status,
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    if (error instanceof Error && (error.message.startsWith("Unauthorized") || error.message.includes("Silakan login"))) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu untuk melanjutkan" },
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
      { error: "Gagal mengambil data peserta" },
      { status: 500 }
    );
  }
}
