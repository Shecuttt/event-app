import { db } from "@/src/db";
import { events, ticketTypes, users, type Event } from "@/src/db/schema";
import { eq, and, desc, asc, sql, like, gte, lte, SQL } from "drizzle-orm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface EventFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  locationType?: "offline" | "online";
  type?: "free" | "paid"; // free = all tickets price = 0, paid = any ticket price > 0
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  sort?: "startAt_asc" | "startAt_desc" | "createdAt_desc";
}

export interface PaginatedEventsResult {
  events: EventWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type EventWithRelations = Event & {
  organizer: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  ticketTypes: {
    id: string;
    name: string;
    price: number;
    quota: number;
    soldCount: number;
  }[];
};

// ─── PUBLISHED EVENTS ─────────────────────────────────────────────────────────

export async function getPublishedEvents(
  filters: EventFilters = {}
): Promise<PaginatedEventsResult> {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    locationType,
    type,
    dateFrom,
    dateTo,
    sort = "startAt_asc",
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions: SQL<unknown>[] = [eq(events.status, "published")];

  if (search) {
    conditions.push(like(events.title, `%${search}%`));
  }

  if (category) {
    conditions.push(eq(events.category, category as typeof events.category.enumValues[number]));
  }

  if (locationType) {
    conditions.push(eq(events.locationType, locationType));
  }

  if (dateFrom) {
    conditions.push(gte(events.startAt, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(lte(events.startAt, new Date(dateTo)));
  }

  // Get total count first
  const whereClause = and(...conditions);
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Build sort order
  let orderBy: SQL<unknown>;
  switch (sort) {
    case "startAt_desc":
      orderBy = desc(events.startAt);
      break;
    case "createdAt_desc":
      orderBy = desc(events.createdAt);
      break;
    case "startAt_asc":
    default:
      orderBy = asc(events.startAt);
  }

  // Query events with organizer
  const eventsData = await db
    .select({
      event: events,
      organizer: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(events)
    .innerJoin(users, eq(events.organizerId, users.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Get ticket types for all events
  const eventIds = eventsData.map((e) => e.event.id);

  let ticketTypesData: typeof ticketTypes.$inferSelect[] = [];
  if (eventIds.length > 0) {
    ticketTypesData = await db
      .select()
      .from(ticketTypes)
      .where(sql`${ticketTypes.eventId} IN (${sql.join(eventIds, sql`, `)})`);
  }

  // Group ticket types by event
  const ticketTypesByEvent = new Map<string, typeof ticketTypesData>();
  for (const tt of ticketTypesData) {
    const existing = ticketTypesByEvent.get(tt.eventId) ?? [];
    existing.push(tt);
    ticketTypesByEvent.set(tt.eventId, existing);
  }

  // Filter by type (free/paid) if specified
  let resultEvents = eventsData.map(({ event, organizer }) => ({
    ...event,
    organizer,
    ticketTypes: (ticketTypesByEvent.get(event.id) ?? []).map((tt) => ({
      id: tt.id,
      name: tt.name,
      price: tt.price,
      quota: tt.quota,
      soldCount: tt.soldCount,
    })),
  }));

  if (type === "free") {
    resultEvents = resultEvents.filter((e) =>
      e.ticketTypes.every((tt) => tt.price === 0)
    );
  } else if (type === "paid") {
    resultEvents = resultEvents.filter((e) =>
      e.ticketTypes.some((tt) => tt.price > 0)
    );
  }

  return {
    events: resultEvents,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── SINGLE EVENT ─────────────────────────────────────────────────────────────

export async function getEventById(
  id: string
): Promise<EventWithRelations | null> {
  const result = await db
    .select({
      event: events,
      organizer: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(events)
    .innerJoin(users, eq(events.organizerId, users.id))
    .where(eq(events.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { event, organizer } = result[0];

  const ticketTypesData = await db
    .select({
      id: ticketTypes.id,
      name: ticketTypes.name,
      price: ticketTypes.price,
      quota: ticketTypes.quota,
      soldCount: ticketTypes.soldCount,
    })
    .from(ticketTypes)
    .where(eq(ticketTypes.eventId, id));

  return {
    ...event,
    organizer,
    ticketTypes: ticketTypesData,
  };
}

// ─── ORGANIZER EVENTS ─────────────────────────────────────────────────────────

export async function getOrganizerEvents(
  organizerId: string,
  filters: Omit<EventFilters, "type"> = {}
): Promise<PaginatedEventsResult> {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    locationType,
    dateFrom,
    dateTo,
    sort = "createdAt_desc",
  } = filters;

  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions: SQL<unknown>[] = [eq(events.organizerId, organizerId)];

  if (search) {
    conditions.push(like(events.title, `%${search}%`));
  }

  if (category) {
    conditions.push(eq(events.category, category as typeof events.category.enumValues[number]));
  }

  if (locationType) {
    conditions.push(eq(events.locationType, locationType));
  }

  if (dateFrom) {
    conditions.push(gte(events.startAt, new Date(dateFrom)));
  }

  if (dateTo) {
    conditions.push(lte(events.startAt, new Date(dateTo)));
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(events)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Build sort order
  let orderBy: SQL<unknown>;
  switch (sort) {
    case "startAt_asc":
      orderBy = asc(events.startAt);
      break;
    case "startAt_desc":
      orderBy = desc(events.startAt);
      break;
    case "createdAt_desc":
    default:
      orderBy = desc(events.createdAt);
  }

  // Query events
  const eventsData = await db
    .select({
      event: events,
      organizer: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(events)
    .innerJoin(users, eq(events.organizerId, users.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Get ticket types for all events
  const eventIds = eventsData.map((e) => e.event.id);

  let ticketTypesData: typeof ticketTypes.$inferSelect[] = [];
  if (eventIds.length > 0) {
    ticketTypesData = await db
      .select()
      .from(ticketTypes)
      .where(sql`${ticketTypes.eventId} IN (${sql.join(eventIds, sql`, `)})`);
  }

  // Group ticket types by event
  const ticketTypesByEvent = new Map<string, typeof ticketTypesData>();
  for (const tt of ticketTypesData) {
    const existing = ticketTypesByEvent.get(tt.eventId) ?? [];
    existing.push(tt);
    ticketTypesByEvent.set(tt.eventId, existing);
  }

  return {
    events: eventsData.map(({ event, organizer }) => ({
      ...event,
      organizer,
      ticketTypes: (ticketTypesByEvent.get(event.id) ?? []).map((tt) => ({
        id: tt.id,
        name: tt.name,
        price: tt.price,
        quota: tt.quota,
        soldCount: tt.soldCount,
      })),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── EVENT WITH OWNER CHECK ───────────────────────────────────────────────────

export async function getEventWithOwnerCheck(
  id: string,
  organizerId: string
): Promise<Event & { ticketTypes: typeof ticketTypes.$inferSelect[] } | null> {
  const result = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.organizerId, organizerId)))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const event = result[0];

  const ticketTypesData = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.eventId, id));

  return {
    ...event,
    ticketTypes: ticketTypesData,
  };
}
