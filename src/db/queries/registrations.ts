import { db } from "@/src/db";
import {
  registrations,
  events,
  ticketTypes,
  users,
  type Registration,
} from "@/src/db/schema";
import { eq, and, desc, asc, sql, SQL, count } from "drizzle-orm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface RegistrationFilters {
  page?: number;
  limit?: number;
  status?: "registered" | "checked_in" | "absent";
}

export interface PaginatedRegistrationsResult {
  registrations: RegistrationWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type RegistrationWithRelations = Registration & {
  event: {
    id: string;
    title: string;
    posterUrl: string | null;
    startAt: Date;
    locationType: "offline" | "online";
    locationDetail: string;
  };
  ticketType: {
    name: string;
    price: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export type RegistrationFull = Registration & {
  event: typeof events.$inferSelect;
  ticketType: typeof ticketTypes.$inferSelect;
  user: typeof users.$inferSelect;
};

export interface AttendeeFilters {
  page?: number;
  limit?: number;
  status?: "registered" | "checked_in" | "absent";
}

export type AttendeeWithRelations = Registration & {
  user: {
    id: string;
    name: string;
    email: string;
  };
  ticketType: {
    name: string;
    price: number;
  };
};

export interface PaginatedAttendeesResult {
  attendees: AttendeeWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── GET REGISTRATION BY QR CODE ──────────────────────────────────────────────

export async function getRegistrationByQrCode(
  qrCode: string
): Promise<RegistrationFull | null> {
  const result = await db
    .select({
      registration: registrations,
      event: events,
      ticketType: ticketTypes,
      user: users,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .innerJoin(users, eq(registrations.userId, users.id))
    .where(eq(registrations.qrCode, qrCode))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { registration, event, ticketType, user } = result[0];

  return {
    ...registration,
    event,
    ticketType,
    user,
  };
}

// ─── GET REGISTRATIONS BY USER ────────────────────────────────────────────────

export async function getRegistrationsByUser(
  userId: string,
  filters: RegistrationFilters = {}
): Promise<PaginatedRegistrationsResult> {
  const { page = 1, limit = 10, status } = filters;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions: SQL<unknown>[] = [eq(registrations.userId, userId)];

  if (status) {
    conditions.push(eq(registrations.status, status));
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Query registrations with relations
  const registrationsData = await db
    .select({
      registration: registrations,
      event: {
        id: events.id,
        title: events.title,
        posterUrl: events.posterUrl,
        startAt: events.startAt,
        locationType: events.locationType,
        locationDetail: events.locationDetail,
      },
      ticketType: {
        name: ticketTypes.name,
        price: ticketTypes.price,
      },
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(whereClause)
    .orderBy(desc(registrations.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    registrations: registrationsData.map(({ registration, event, ticketType }) => ({
      ...registration,
      event,
      ticketType,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── GET REGISTRATION BY ID ───────────────────────────────────────────────────

export async function getRegistrationById(
  id: string
): Promise<RegistrationFull | null> {
  const result = await db
    .select({
      registration: registrations,
      event: events,
      ticketType: ticketTypes,
      user: users,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .innerJoin(users, eq(registrations.userId, users.id))
    .where(eq(registrations.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { registration, event, ticketType, user } = result[0];

  return {
    ...registration,
    event,
    ticketType,
    user,
  };
}

// ─── GET ATTENDEES BY EVENT ───────────────────────────────────────────────────

export async function getAttendeesByEvent(
  eventId: string,
  filters: AttendeeFilters = {}
): Promise<PaginatedAttendeesResult> {
  const { page = 1, limit = 10, status } = filters;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions: SQL<unknown>[] = [eq(registrations.eventId, eventId)];

  if (status) {
    conditions.push(eq(registrations.status, status));
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Query attendees with user and ticket type info
  const attendeesData = await db
    .select({
      registration: registrations,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      ticketType: {
        name: ticketTypes.name,
        price: ticketTypes.price,
      },
    })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(whereClause)
    .orderBy(desc(registrations.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    attendees: attendeesData.map(({ registration, user, ticketType }) => ({
      ...registration,
      user,
      ticketType,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── GET ALL ATTENDEES BY EVENT (NO PAGINATION - FOR EXPORT) ───────────────────

export async function getAllAttendeesByEvent(
  eventId: string
): Promise<AttendeeWithRelations[]> {
  const attendeesData = await db
    .select({
      registration: registrations,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      ticketType: {
        name: ticketTypes.name,
        price: ticketTypes.price,
      },
    })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(eq(registrations.eventId, eventId))
    .orderBy(desc(registrations.createdAt));

  return attendeesData.map(({ registration, user, ticketType }) => ({
    ...registration,
    user,
    ticketType,
  }));
}

// ─── GET REGISTRATION BY USER AND EVENT (CHECK IF EXISTS) ─────────────────────

export async function getRegistrationByUserAndEvent(
  userId: string,
  eventId: string
): Promise<Registration | null> {
  const result = await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.userId, userId),
        eq(registrations.eventId, eventId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ─── COUNT REGISTRATIONS BY EVENT ─────────────────────────────────────────────

export async function countRegistrationsByEvent(eventId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.eventId, eventId));

  return result[0]?.count ?? 0;
}
