"use server";

import { db } from "@/src/db";
import { events, ticketTypes, type NewEvent, eventCategoryEnum } from "@/src/db/schema";
import { requireRole } from "@/src/lib/auth";
import { getEventWithOwnerCheck } from "@/src/db/queries/events";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CreateEventInput {
  title: string;
  description: string;
  category: typeof eventCategoryEnum.enumValues[number];
  locationType: "offline" | "online";
  locationDetail: string;
  startAt: string; // ISO string
  endAt: string; // ISO string
  capacity: number | null;
  posterUrl?: string;
  ticketTypes: {
    name: string;
    price: number;
    quota: number;
  }[];
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  category?: typeof eventCategoryEnum.enumValues[number];
  locationType?: "offline" | "online";
  locationDetail?: string;
  startAt?: string; // ISO string
  endAt?: string; // ISO string
  capacity?: number | null;
  posterUrl?: string;
  status?: "draft" | "published" | "cancelled" | "completed";
}

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────

export async function createEvent(data: CreateEventInput) {
  const session = await requireRole("organizer");

  // Validasi minimal 1 ticket type
  if (!data.ticketTypes || data.ticketTypes.length === 0) {
    throw new Error("Minimal harus ada 1 tipe tiket");
  }

  // Validasi endAt harus setelah startAt
  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);

  if (endAt <= startAt) {
    throw new Error("Waktu selesai harus setelah waktu mulai");
  }

  // Create event dengan transaction
  try {
    const result = await db.transaction(async (tx) => {
      // Insert event
      const [event] = await tx
        .insert(events)
        .values({
          organizerId: session.user.id,
          title: data.title,
          description: data.description,
          category: data.category,
          status: "draft", // Status awal selalu draft
          locationType: data.locationType,
          locationDetail: data.locationDetail,
          startAt,
          endAt,
          capacity: data.capacity,
          posterUrl: data.posterUrl,
        } as NewEvent)
        .returning();

      // Insert ticket types
      const ticketTypesData = data.ticketTypes.map((tt) => ({
        eventId: event.id,
        name: tt.name,
        price: tt.price, // Harga dalam integer Rupiah
        quota: tt.quota,
        soldCount: 0,
      }));

      await tx.insert(ticketTypes).values(ticketTypesData);

      return event;
    });

    revalidatePath("/dashboard/events");
    return { success: true, eventId: result.id };
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Gagal membuat event");
  }
}

// ─── UPDATE EVENT ─────────────────────────────────────────────────────────────

export async function updateEvent(id: string, data: UpdateEventInput) {
  const session = await requireRole("organizer");

  // Check ownership
  const existingEvent = await getEventWithOwnerCheck(id, session.user.id);
  if (!existingEvent) {
    throw new Error("Event tidak ditemukan atau Anda tidak memiliki akses");
  }

  // Validasi transisi status
  if (data.status) {
    const validTransitions: Record<string, string[]> = {
      draft: ["published", "cancelled"],
      published: ["cancelled", "completed"],
      cancelled: [],
      completed: [], // Tidak bisa kembali dari completed
    };

    const allowedTransitions = validTransitions[existingEvent.status];
    if (!allowedTransitions.includes(data.status)) {
      throw new Error(
        `Transisi status tidak valid: ${existingEvent.status} → ${data.status}`
      );
    }
  }

  // Validasi endAt harus setelah startAt jika keduanya diupdate
  if (data.startAt || data.endAt) {
    const startAt = data.startAt ? new Date(data.startAt) : existingEvent.startAt;
    const endAt = data.endAt ? new Date(data.endAt) : existingEvent.endAt;

    if (endAt <= startAt) {
      throw new Error("Waktu selesai harus setelah waktu mulai");
    }
  }

  // Build update data
  const updateData: Partial<NewEvent> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category as typeof events.category.enumValues[number];
  if (data.locationType !== undefined) updateData.locationType = data.locationType;
  if (data.locationDetail !== undefined) updateData.locationDetail = data.locationDetail;
  if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
  if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.posterUrl !== undefined) updateData.posterUrl = data.posterUrl;
  if (data.status !== undefined) updateData.status = data.status as typeof events.status.enumValues[number];

  try {
    await db
      .update(events)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id));

    revalidatePath("/dashboard/events");
    revalidatePath(`/events/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error("Gagal mengupdate event");
  }
}

// ─── DELETE EVENT ─────────────────────────────────────────────────────────────

export async function deleteEvent(id: string) {
  const session = await requireRole("organizer");

  // Check ownership
  const existingEvent = await getEventWithOwnerCheck(id, session.user.id);
  if (!existingEvent) {
    throw new Error("Event tidak ditemukan atau Anda tidak memiliki akses");
  }

  // Validasi hanya bisa hapus jika status draft
  if (existingEvent.status !== "draft") {
    throw new Error("Hanya event dengan status draft yang bisa dihapus");
  }

  // Validasi soldCount semua ticketTypes = 0
  const hasSoldTickets = existingEvent.ticketTypes.some(
    (tt) => tt.soldCount > 0
  );
  if (hasSoldTickets) {
    throw new Error("Tidak bisa menghapus event yang sudah memiliki penjualan tiket");
  }

  try {
    await db.delete(events).where(eq(events.id, id));

    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error("Gagal menghapus event");
  }
}
