import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth";
import { getRegistrationsByUser } from "@/src/db/queries/registrations";

// ─── CACHE CONFIGURATION ──────────────────────────────────────────────────────

const CACHE_CONTROL = "private, no-store";

// ─── GET /api/v1/registrations/my ─────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    // 1. Auth required
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Anda harus login" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "10", 10);
    const status = searchParams.get("status") as "registered" | "checked_in" | "absent" | undefined;

    // Validate pagination params
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

    const result = await getRegistrationsByUser(userId, {
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
    console.error("Error fetching user registrations:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data registrasi" },
      { status: 500 }
    );
  }
}
