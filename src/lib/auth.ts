import { auth } from "@/auth";
import type { Session } from "next-auth";
import { db } from "@/src/db";
import { events, type Event } from "@/src/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current session in server components
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const session = await auth();
  return session;
}

/**
 * Ensure user is authenticated
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await auth();

  if (!session) {
    throw new Error("Silakan login terlebih dahulu untuk melanjutkan");
  }

  return session;
}

/**
 * Ensure user is the owner of the event
 * Throws 404 if event not found, 403 if not owner
 */
export async function requireEventOwner(
  eventId: string,
  userId: string
): Promise<Event> {
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.organizerId !== userId) {
    throw new Error("Forbidden - You are not the owner of this event");
  }

  return event;
}
