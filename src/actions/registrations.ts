"use server";

import { db } from "@/src/db";
import { registrations, events, ticketTypes } from "@/src/db/schema";
import { requireAuth } from "@/src/lib/auth";
import {
  getRegistrationByUserAndEvent,
  countRegistrationsByEvent,
} from "@/src/db/queries/registrations";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface RegistrationResult {
  success: boolean;
  registrationId: string;
  qrCode: string;
  eventId: string;
  ticketTypeId: string;
  status: "registered";
  createdAt: Date;
}

// ─── REGISTER EVENT ───────────────────────────────────────────────────────────

export async function registerEvent(
  eventId: string,
  ticketTypeId: string
): Promise<RegistrationResult | { success: false; error: string }> {
  try {
    // 1. Validasi user sudah login
    const session = await requireAuth();
    const userId = session.user.id;

    // 2. Validasi event exists, status "published", dan belum melewati endAt
    const eventResult = await db
      .select({
        id: events.id,
        status: events.status,
        endAt: events.endAt,
        capacity: events.capacity,
        title: events.title,
        organizerId: events.organizerId,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (eventResult.length === 0) {
      return { success: false, error: "Event tidak ditemukan" };
    }

    const event = eventResult[0];

    if (event.status !== "published") {
      return {
        success: false,
        error: `Event tidak tersedia untuk registrasi (status: ${event.status})`
      };
    }

    const now = new Date();
    if (now > event.endAt) {
      return { success: false, error: "Event sudah berakhir" };
    }

    // 3. Validasi organizer tidak bisa registrasi ke event sendiri
    if (event.organizerId === userId) {
      return { success: false, error: "Organizer tidak bisa mendaftar ke event sendiri" };
    }

    // 4. Validasi user belum pernah registrasi event yang sama
    const existingRegistration = await getRegistrationByUserAndEvent(
      userId,
      eventId
    );
    if (existingRegistration) {
      return { success: false, error: "Anda sudah terdaftar di event ini" };
    }

    // 5. Validasi ticketType milik event tersebut
    const ticketTypeResult = await db
      .select({
        id: ticketTypes.id,
        quota: ticketTypes.quota,
        soldCount: ticketTypes.soldCount,
        price: ticketTypes.price,
        name: ticketTypes.name,
      })
      .from(ticketTypes)
      .where(and(eq(ticketTypes.id, ticketTypeId), eq(ticketTypes.eventId, eventId)))
      .limit(1);

    if (ticketTypeResult.length === 0) {
      return {
        success: false,
        error: "Tipe tiket tidak ditemukan untuk event ini"
      };
    }

    const ticketType = ticketTypeResult[0];

    // 6. Guard: Untuk event berbayar, gunakan payment flow (Sprint 4)
    if (ticketType.price > 0) {
      return { success: false, error: "Event berbayar harus melalui flow pembayaran" };
    }

    // 7. Validasi kuota: soldCount < quota
    if (ticketType.soldCount >= ticketType.quota) {
      return { success: false, error: "Kuota tiket sudah habis" };
    }

    // 8. Validasi kapasitas event: jika capacity tidak null, total registrations < capacity
    if (event.capacity !== null && event.capacity > 0) {
      const totalRegistrations = await countRegistrationsByEvent(eventId);
      if (totalRegistrations >= event.capacity) {
        return { success: false, error: "Kapasitas event sudah penuh" };
      }
    }

    // 9. Jalankan dalam satu transaction
    const result = await db.transaction(async (tx) => {
      // Insert row baru ke registrations dengan status "registered"
      const [registration] = await tx
        .insert(registrations)
        .values({
          userId,
          eventId,
          ticketTypeId,
          status: "registered",
          qrCode: null, // Akan diupdate setelah mendapat ID
        })
        .returning();

      // Increment soldCount di ticketTypes
      await tx
        .update(ticketTypes)
        .set({
          soldCount: ticketType.soldCount + 1,
        })
        .where(eq(ticketTypes.id, ticketTypeId));

      // Generate qrCode: IVENTO-{registrationId}-{randomHash6char}
      const randomHash = randomBytes(3).toString("hex").toUpperCase(); // 6 chars
      const qrCode = `IVENTO-${registration.id}-${randomHash}`;

      // Update qrCode di row registrasi yang baru dibuat
      const [updatedRegistration] = await tx
        .update(registrations)
        .set({ qrCode })
        .where(eq(registrations.id, registration.id))
        .returning();

      return updatedRegistration;
    });

    revalidatePath("/dashboard/registrations");
    revalidatePath(`/events/${eventId}`);

    return {
      success: true,
      registrationId: result.id,
      qrCode: result.qrCode!,
      eventId: result.eventId,
      ticketTypeId: result.ticketTypeId,
      status: "registered",
      createdAt: result.createdAt,
    };
  } catch (error) {
    console.error("Error registering for event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mendaftar event - Terjadi kesalahan pada sistem"
    };
  }
}
