"use server";

import { db } from "@/src/db";
import { registrations, events, ticketTypes, users, transactions } from "@/src/db/schema";
import { getSession } from "@/src/lib/auth";
import { getRegistrationByUserAndEvent, countRegistrationsByEvent } from "@/src/db/queries/registrations";
import { createSnapTransaction } from "@/src/lib/midtrans";
import { eq, and } from "drizzle-orm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface PaymentResult {
  registrationId: string;
  transactionId: string;
  snapToken: string;
  paymentUrl: string;
}

// ─── INITIATE PAYMENT ─────────────────────────────────────────────────────────

/**
 * Initiate payment flow for paid events
 * Creates registration and transaction, then returns Midtrans payment URL
 */
export async function initiatePayment(
  eventId: string,
  ticketTypeId: string
): Promise<PaymentResult | { success: false; error: string }> {
  try {
    // 1. Validasi user sudah login
    const session = await getSession();
    if (!session) {
      return { success: false, error: "Silakan login terlebih dahulu untuk mendaftar event" };
    }

    const userId = session.user.id;

    // Get user details for Midtrans customer info
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return { success: false, error: "User not found" };
    }

    const user = userResult[0];

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

    // 3. Validasi user belum pernah registrasi event yang sama
    const existingRegistration = await getRegistrationByUserAndEvent(userId, eventId);
    if (existingRegistration) {
      return { success: false, error: "Anda sudah terdaftar di event ini" };
    }

    // 4. Validasi organizer tidak bisa registrasi ke event sendiri
    if (event.organizerId === userId) {
      return { success: false, error: "Organizer tidak bisa mendaftar ke event sendiri" };
    }

    // 5. Validasi ticketType milik event tersebut dan harga > 0
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

    // Validasi tiket berbayar
    if (ticketType.price <= 0) {
      return { success: false, error: "Event gratis harus melalui flow registrasi gratis" };
    }

    // 6. Validasi kuota: soldCount < quota
    if (ticketType.soldCount >= ticketType.quota) {
      return { success: false, error: "Kuota tiket sudah habis" };
    }

    // 7. Validasi kapasitas event: jika capacity tidak null, total registrations < capacity
    if (event.capacity !== null && event.capacity > 0) {
      const totalRegistrations = await countRegistrationsByEvent(eventId);
      if (totalRegistrations >= event.capacity) {
        return { success: false, error: "Kapasitas event sudah penuh" };
      }
    }

    // 8. Jalankan dalam satu transaction
    const result = await db.transaction(async (tx) => {
      // Insert row baru ke registrations dengan status "registered", qrCode null
      const [registration] = await tx
        .insert(registrations)
        .values({
          userId,
          eventId,
          ticketTypeId,
          status: "registered",
          qrCode: null, // QR code akan digenerate setelah payment confirmed
        })
        .returning();

      // Generate midtransOrderId: IVENTO-{registrationId}
      const midtransOrderId = `IVENTO-${registration.id}`;

      // Insert row ke transactions dengan status "pending"
      const [transaction] = await tx
        .insert(transactions)
        .values({
          registrationId: registration.id,
          amount: ticketType.price,
          paymentMethod: null, // Akan diisi setelah payment
          midtransOrderId: midtransOrderId,
          status: "pending",
          paidAt: null,
        })
        .returning();

      // Increment soldCount di ticketTypes
      await tx
        .update(ticketTypes)
        .set({
          soldCount: ticketType.soldCount + 1,
        })
        .where(eq(ticketTypes.id, ticketTypeId));

      return {
        registrationId: registration.id,
        transactionId: transaction.id,
        midtransOrderId: transaction.midtransOrderId,
        amount: transaction.amount,
      };
    });

    // 9. Panggil Midtrans untuk membuat transaksi
    // Split name into first and last name for Midtrans
    const nameParts = (user.name ?? "User").split(" ");
    const firstName = nameParts[0] || "User";
    const lastName = nameParts.slice(1).join(" ") || undefined;

    const { snapToken, redirectUrl } = await createSnapTransaction(
      result.midtransOrderId,
      result.amount,
      {
        firstName,
        lastName,
        email: user.email,
      }
    );

    return {
      registrationId: result.registrationId,
      transactionId: result.transactionId,
      snapToken,
      paymentUrl: redirectUrl,
    };
  } catch (error) {
    console.error("Error initiating payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memulai pembayaran - Terjadi kesalahan pada sistem"
    };
  }
}
