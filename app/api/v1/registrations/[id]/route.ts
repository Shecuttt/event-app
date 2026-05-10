import { NextResponse } from "next/server";
import { getSession, isOrganizer } from "@/src/lib/auth";
import { getRegistrationById } from "@/src/db/queries/registrations";

// ─── CACHE CONFIGURATION ──────────────────────────────────────────────────────

const CACHE_CONTROL = "private, no-store";

// ─── GET /api/v1/registrations/[id] ─────────────────────────────────────────────

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 1. Auth required
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Anda harus login" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;
    const userRole = session.user.role;

    // 2. Get registration details
    const registration = await getRegistrationById(id);

    if (!registration) {
      return NextResponse.json(
        { error: "Registrasi tidak ditemukan" },
        { status: 404 }
      );
    }

    // 3. Authorization check: Only owner or organizer of the event can access
    const isOwner = registration.userId === userId;
    const isEventOrganizer =
      userRole === "organizer" && registration.event.organizerId === userId;

    if (!isOwner && !isEventOrganizer) {
      return NextResponse.json(
        { error: "Forbidden - Anda tidak memiliki akses ke registrasi ini" },
        { status: 403 }
      );
    }

    return NextResponse.json(registration, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Error fetching registration:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data registrasi" },
      { status: 500 }
    );
  }
}
