"use server";

import { db } from "@/src/db";
import { registrations } from "@/src/db/schema";
import { requireRole } from "@/src/lib/auth";
import { getRegistrationByQrCode } from "@/src/db/queries/registrations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CheckInResult {
  success: boolean;
  registrationId: string;
  attendee: {
    name: string;
    email: string;
    ticketType: string;
  };
  checkedInAt: Date;
}

export interface CheckInError {
  error: string;
  code: "NOT_FOUND" | "UNAUTHORIZED" | "ALREADY_CHECKED_IN" | "SERVER_ERROR";
}

// ─── CHECK IN ATTENDEE ────────────────────────────────────────────────────────

export async function checkInAttendee(qrCode: string): Promise<CheckInResult> {
  // 1. Validasi user adalah organizer
  const session = await requireRole("organizer");
  const organizerId = session.user.id;

  // 2. Query registrasi berdasarkan qrCode
  const registration = await getRegistrationByQrCode(qrCode);

  // 3. Validasi registrasi ditemukan
  if (!registration) {
    throw new Error("NOT_FOUND - Registrasi tidak ditemukan");
  }

  // 4. Validasi eventId dari registrasi adalah event milik organizer yang sedang login
  if (registration.event.organizerId !== organizerId) {
    throw new Error(
      "UNAUTHORIZED - Anda bukan organizer dari event terkait"
    );
  }

  // 5. Validasi status belum "checked_in"
  if (registration.status === "checked_in") {
    throw new Error("ALREADY_CHECKED_IN - Peserta sudah melakukan check-in");
  }

  // 6. Update status ke "checked_in" dan set attendedAt ke waktu sekarang
  const now = new Date();

  try {
    await db
      .update(registrations)
      .set({
        status: "checked_in",
        attendedAt: now,
      })
      .where(eq(registrations.id, registration.id));

    revalidatePath(`/dashboard/events/${registration.eventId}/attendees`);

    // 7. Return data peserta: nama, email, nama tiket
    return {
      success: true,
      registrationId: registration.id,
      attendee: {
        name: registration.user.name,
        email: registration.user.email,
        ticketType: registration.ticketType.name,
      },
      checkedInAt: now,
    };
  } catch (error) {
    console.error("Error checking in attendee:", error);
    throw new Error("SERVER_ERROR - Gagal melakukan check-in");
  }
}
