import { NextResponse } from "next/server";
import { requireRole } from "@/src/lib/auth";
import { getEventWithOwnerCheck } from "@/src/db/queries/events";
import { getAllAttendeesByEvent } from "@/src/db/queries/registrations";

// ─── GET /api/v1/events/[id]/attendees/export ───────────────────────────────────

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 1. Auth required, role organizer
    const session = await requireRole("organizer");
    const organizerId = session.user.id;

    const { id } = await params;

    // 2. Verify event exists and belongs to the organizer
    const event = await getEventWithOwnerCheck(id, organizerId);

    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan atau Anda bukan pemilik event" },
        { status: 404 }
      );
    }

    // 3. Get all attendees for export
    const attendees = await getAllAttendeesByEvent(id);

    // 4. Generate CSV content
    // Header row
    const headers = ["name", "email", "ticketType", "status", "registeredAt", "attendedAt"];

    // Data rows
    const rows = attendees.map((attendee) => {
      const registeredAt = attendee.createdAt
        ? new Date(attendee.createdAt).toISOString()
        : "";
      const attendedAt = attendee.attendedAt
        ? new Date(attendee.attendedAt).toISOString()
        : "";

      return [
        // Escape quotes and wrap in quotes if contains special characters
        escapeCsvField(attendee.user.name),
        escapeCsvField(attendee.user.email),
        escapeCsvField(attendee.ticketType.name),
        attendee.status,
        registeredAt,
        attendedAt,
      ];
    });

    // Combine into CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // 5. Return CSV response with proper headers
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendees-${id}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Error exporting event attendees:", error);
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
      { error: "Gagal mengekspor data peserta" },
      { status: 500 }
    );
  }
}

// ─── CSV UTILITIES ──────────────────────────────────────────────────────────────

function escapeCsvField(field: string): string {
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
