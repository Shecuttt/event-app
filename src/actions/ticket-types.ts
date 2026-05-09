"use server";

import { db } from "@/src/db";
import { ticketTypes, events } from "@/src/db/schema";
import { requireRole } from "@/src/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AddTicketTypeInput {
  name: string;
  price: number;
  quota: number;
}

export interface UpdateTicketTypeInput {
  name?: string;
  price?: number;
  quota?: number;
}

// ─── ADD TICKET TYPE ──────────────────────────────────────────────────────────

export async function addTicketType(eventId: string, data: AddTicketTypeInput) {
  const session = await requireRole("organizer");

  // Check event ownership
  const event = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organizerId, session.user.id)))
    .limit(1);

  if (event.length === 0) {
    throw new Error("Event tidak ditemukan atau Anda tidak memiliki akses");
  }

  // Insert ticket type
  try {
    const [ticketType] = await db
      .insert(ticketTypes)
      .values({
        eventId,
        name: data.name,
        price: data.price, // Harga dalam integer Rupiah
        quota: data.quota,
        soldCount: 0,
      })
      .returning();

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/events/${eventId}`);
    return { success: true, ticketTypeId: ticketType.id };
  } catch (error) {
    console.error("Error adding ticket type:", error);
    throw new Error("Gagal menambahkan tipe tiket");
  }
}

// ─── UPDATE TICKET TYPE ───────────────────────────────────────────────────────

export async function updateTicketType(
  ticketTypeId: string,
  data: UpdateTicketTypeInput
) {
  const session = await requireRole("organizer");

  // Get ticket type with event check
  const result = await db
    .select({
      ticketType: ticketTypes,
      event: events,
    })
    .from(ticketTypes)
    .innerJoin(events, eq(ticketTypes.eventId, events.id))
    .where(
      and(
        eq(ticketTypes.id, ticketTypeId),
        eq(events.organizerId, session.user.id)
      )
    )
    .limit(1);

  if (result.length === 0) {
    throw new Error("Tipe tiket tidak ditemukan atau Anda tidak memiliki akses");
  }

  const { ticketType, event } = result[0];

  // Validasi: harga dan quota tidak bisa diubah jika sudah ada soldCount > 0
  if (ticketType.soldCount > 0) {
    if (data.price !== undefined || data.quota !== undefined) {
      throw new Error(
        "Harga dan quota tidak bisa diubah karena sudah ada tiket yang terjual"
      );
    }
  }

  // Build update data
  const updateData: Partial<typeof ticketTypes.$inferInsert> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.price !== undefined && ticketType.soldCount === 0) {
    updateData.price = data.price;
  }
  if (data.quota !== undefined && ticketType.soldCount === 0) {
    updateData.quota = data.quota;
  }

  // Only update if there's something to update
  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  try {
    await db
      .update(ticketTypes)
      .set(updateData)
      .where(eq(ticketTypes.id, ticketTypeId));

    revalidatePath(`/dashboard/events/${event.id}`);
    revalidatePath(`/events/${event.id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating ticket type:", error);
    throw new Error("Gagal mengupdate tipe tiket");
  }
}

// ─── DELETE TICKET TYPE ───────────────────────────────────────────────────────

export async function deleteTicketType(ticketTypeId: string) {
  const session = await requireRole("organizer");

  // Get ticket type with event check
  const result = await db
    .select({
      ticketType: ticketTypes,
      event: events,
    })
    .from(ticketTypes)
    .innerJoin(events, eq(ticketTypes.eventId, events.id))
    .where(
      and(
        eq(ticketTypes.id, ticketTypeId),
        eq(events.organizerId, session.user.id)
      )
    )
    .limit(1);

  if (result.length === 0) {
    throw new Error("Tipe tiket tidak ditemukan atau Anda tidak memiliki akses");
  }

  const { ticketType, event } = result[0];

  // Validasi: hanya bisa hapus jika soldCount === 0
  if (ticketType.soldCount > 0) {
    throw new Error("Tidak bisa menghapus tipe tiket yang sudah memiliki penjualan");
  }

  try {
    await db.delete(ticketTypes).where(eq(ticketTypes.id, ticketTypeId));

    revalidatePath(`/dashboard/events/${event.id}`);
    revalidatePath(`/events/${event.id}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting ticket type:", error);
    throw new Error("Gagal menghapus tipe tiket");
  }
}
