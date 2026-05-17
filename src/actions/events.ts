"use server";

import { db } from "@/src/db";
import { events, ticketTypes, users, type NewEvent, eventCategoryEnum } from "@/src/db/schema";
import { requireAuth, requireEventOwner } from "@/src/lib/auth";
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
  capacity?: number | null;
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
  ticketTypes?: {
    id?: string;
    name: string;
    price: number;
    quota: number;
  }[];
}

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────

export async function createEvent(
  data: CreateEventInput
): Promise<{ success: true; eventId: string } | { success: false; error: string }> {
  try {
    const session = await requireAuth();

    // Validasi minimal 1 ticket type
    if (!data.ticketTypes || data.ticketTypes.length === 0) {
      return { success: false, error: "Minimal harus ada 1 tipe tiket" };
    }

    // Validasi endAt harus setelah startAt
    const startAt = new Date(data.startAt);
    const endAt = new Date(data.endAt);

    if (endAt <= startAt) {
      return { success: false, error: "Waktu selesai harus setelah waktu mulai" };
    }

    // Create event dengan transaction
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat event"
    };
  }
}

// ─── UPDATE EVENT ─────────────────────────────────────────────────────────────

export async function updateEvent(
  id: string,
  data: UpdateEventInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireAuth();

    // Check ownership
    const existingEvent = await requireEventOwner(id, session.user.id);

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
        return {
          success: false,
          error: `Transisi status tidak valid: ${existingEvent.status} → ${data.status}`
        };
      }
    }

    // Validasi endAt harus setelah startAt jika keduanya diupdate
    if (data.startAt || data.endAt) {
      const startAt = data.startAt ? new Date(data.startAt) : existingEvent.startAt;
      const endAt = data.endAt ? new Date(data.endAt) : existingEvent.endAt;

      if (endAt <= startAt) {
        return { success: false, error: "Waktu selesai harus setelah waktu mulai" };
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

    await db.transaction(async (tx) => {
      // Update event
      if (Object.keys(updateData).length > 0) {
        await tx
          .update(events)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(events.id, id));
      }

      // Sync ticket types if provided
      if (data.ticketTypes) {
        const existingTickets = await tx.select().from(ticketTypes).where(eq(ticketTypes.eventId, id));
        const newTicketIds = data.ticketTypes.map(tt => tt.id).filter(Boolean) as string[];
        
        const ticketsToDelete = existingTickets.filter(tt => !newTicketIds.includes(tt.id));
        if (ticketsToDelete.some(tt => tt.soldCount > 0)) {
          throw new Error("Tidak bisa menghapus tipe tiket yang sudah memiliki penjualan");
        }

        if (ticketsToDelete.length > 0) {
          await tx.delete(ticketTypes).where(and(eq(ticketTypes.eventId, id), sql`${ticketTypes.id} IN (${sql.join(ticketsToDelete.map(t => t.id), sql`, `)})`));
        }

        for (const tt of data.ticketTypes) {
          if (tt.id) {
            await tx.update(ticketTypes).set({
              name: tt.name,
              price: tt.price,
              quota: tt.quota,
            }).where(eq(ticketTypes.id, tt.id));
          } else {
            await tx.insert(ticketTypes).values({
              eventId: id,
              name: tt.name,
              price: tt.price,
              quota: tt.quota,
              soldCount: 0,
            });
          }
        }
      }

      // Trigger: if published and user is not yet marked as organizer, upgrade them
      if (data.status === "published" && !session.user.isOrganizer) {
        await tx
          .update(users)
          .set({ isOrganizer: true })
          .where(eq(users.id, session.user.id));
      }
    });

    revalidatePath("/dashboard/events");
    revalidatePath(`/events/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengupdate event"
    };
  }
}

// ─── DELETE EVENT ─────────────────────────────────────────────────────────────

export async function deleteEvent(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const session = await requireAuth();

    // Check ownership
    const existingEvent = await requireEventOwner(id, session.user.id);

    // Validasi hanya bisa hapus jika status draft
    if (existingEvent.status !== "draft") {
      return { success: false, error: "Hanya event dengan status draft yang bisa dihapus" };
    }

    // Validasi soldCount semua ticketTypes = 0
    // Note: existingEvent from requireEventOwner doesn't have ticketTypes by default in our helper, 
    // but we should check it. Let's fetch ticket types here.
    const tickets = await db.select().from(ticketTypes).where(eq(ticketTypes.eventId, id));
    const hasSoldTickets = tickets.some((tt) => tt.soldCount > 0);
    if (hasSoldTickets) {
      return { success: false, error: "Tidak bisa menghapus event yang sudah memiliki penjualan tiket" };
    }

    await db.delete(events).where(eq(events.id, id));

    revalidatePath("/dashboard/events");
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus event"
    };
  }
}
