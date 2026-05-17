import { NextResponse } from "next/server";
import { initiatePayment } from "@/src/actions/payments";

// ─── POST /api/v1/registrations ───────────────────────────────────────────────

interface RegistrationRequestBody {
  eventId: string;
  ticketTypeId: string;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    let body: RegistrationRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { eventId, ticketTypeId } = body;

    if (!eventId || !ticketTypeId) {
      return NextResponse.json(
        { error: "eventId dan ticketTypeId wajib diisi" },
        { status: 400 }
      );
    }

    // Initiate payment flow for paid events
    const result = await initiatePayment(eventId, ticketTypeId);

    if (result && "error" in result) {
      const errorMessage = result.error;
      let status = 400;

      if (errorMessage.includes("Silakan login") || errorMessage.includes("Unauthorized")) {
        status = 401;
      } else if (errorMessage.includes("Event tidak ditemukan") || errorMessage.includes("not found")) {
        status = 404;
      } else if (errorMessage.includes("sudah terdaftar")) {
        status = 409;
      } else if (errorMessage.includes("Organizer tidak bisa mendaftar")) {
        status = 403;
      }

      return NextResponse.json({ error: errorMessage }, { status });
    }

    // Return payment URL for client-side redirect
    return NextResponse.json(
      {
        registrationId: result.registrationId,
        transactionId: result.transactionId,
        snapToken: result.snapToken,
        paymentUrl: result.paymentUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating paid registration:", error);

    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("Unauthorized") || errorMessage.includes("Silakan login")) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    if (errorMessage.includes("EVENT_NOT_FOUND")) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 }
      );
    }

    if (errorMessage.includes("EVENT_NOT_PUBLISHED")) {
      return NextResponse.json(
        { error: "Event tidak tersedia untuk registrasi" },
        { status: 400 }
      );
    }

    if (errorMessage.includes("EVENT_ENDED")) {
      return NextResponse.json(
        { error: "Event sudah berakhir" },
        { status: 400 }
      );
    }

    if (errorMessage.includes("ALREADY_REGISTERED")) {
      return NextResponse.json(
        { error: "Anda sudah terdaftar di event ini" },
        { status: 409 }
      );
    }

    if (errorMessage.includes("CANNOT_REGISTER_OWN_EVENT")) {
      return NextResponse.json(
        { error: "Organizer tidak bisa mendaftar ke event sendiri" },
        { status: 403 }
      );
    }

    if (errorMessage.includes("TICKET_TYPE_NOT_FOUND")) {
      return NextResponse.json(
        { error: "Tipe tiket tidak ditemukan" },
        { status: 404 }
      );
    }

    if (errorMessage.includes("USE_FREE_FLOW")) {
      return NextResponse.json(
        { error: "Event gratis, gunakan flow registrasi gratis" },
        { status: 400 }
      );
    }

    if (errorMessage.includes("TICKET_SOLD_OUT")) {
      return NextResponse.json(
        { error: "Kuota tiket sudah habis" },
        { status: 400 }
      );
    }

    if (errorMessage.includes("EVENT_FULL")) {
      return NextResponse.json(
        { error: "Kapasitas event sudah penuh" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Gagal membuat registrasi" },
      { status: 500 }
    );
  }
}
