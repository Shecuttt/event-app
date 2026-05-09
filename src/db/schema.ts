import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["participant", "organizer"]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "cancelled",
  "completed",
]);

export const eventCategoryEnum = pgEnum("event_category", [
  "music",
  "seminar",
  "sport",
  "workshop",
  "community",
  "other",
]);

export const locationTypeEnum = pgEnum("location_type", ["offline", "online"]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "registered",
  "checked_in",
  "absent",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "paid",
  "cancelled",
  "refunded",
]);

// ─── TABLES ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }), // nullable untuk OAuth-only user
  role: roleEnum("role").notNull().default("participant"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description").notNull(),
    category: eventCategoryEnum("category").notNull(),
    status: eventStatusEnum("status").notNull().default("draft"),
    locationType: locationTypeEnum("location_type").notNull(),
    locationDetail: text("location_detail").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity"), // null = unlimited
    posterUrl: text("poster_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("events_organizer_id_idx").on(table.organizerId),
    index("events_status_idx").on(table.status),
    index("events_start_at_idx").on(table.startAt),
    index("events_category_idx").on(table.category),
    // composite index untuk query listing publik yang paling umum
    index("events_status_start_at_idx").on(table.status, table.startAt),
  ]
);

export const ticketTypes = pgTable(
  "ticket_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    price: integer("price").notNull().default(0), // dalam Rupiah, 0 = gratis
    quota: integer("quota").notNull(),
    soldCount: integer("sold_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("ticket_types_event_id_idx").on(table.eventId),
  ]
);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "restrict" }),
    ticketTypeId: uuid("ticket_type_id")
      .notNull()
      .references(() => ticketTypes.id, { onDelete: "restrict" }),
    status: registrationStatusEnum("status").notNull().default("registered"),
    qrCode: varchar("qr_code", { length: 255 }).unique(), // null sampai payment confirmed (event berbayar)
    attendedAt: timestamp("attended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("registrations_user_id_idx").on(table.userId),
    index("registrations_event_id_idx").on(table.eventId),
    index("registrations_qr_code_idx").on(table.qrCode),
    // prevent duplicate registration: satu user hanya bisa registrasi satu kali per event
    index("registrations_user_event_unique_idx").on(table.userId, table.eventId),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    registrationId: uuid("registration_id")
      .notNull()
      .unique() // one-to-one dengan registrations
      .references(() => registrations.id, { onDelete: "restrict" }),
    amount: integer("amount").notNull(), // dalam Rupiah
    paymentMethod: varchar("payment_method", { length: 50 }), // diisi setelah payment
    midtransOrderId: varchar("midtrans_order_id", { length: 255 }).notNull().unique(),
    status: transactionStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("transactions_registration_id_idx").on(table.registrationId),
    index("transactions_midtrans_order_id_idx").on(table.midtransOrderId),
    index("transactions_status_idx").on(table.status),
  ]
);

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events),
  registrations: many(registrations),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  ticketTypes: many(ticketTypes),
  registrations: many(registrations),
}));

export const ticketTypesRelations = relations(ticketTypes, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTypes.eventId],
    references: [events.id],
  }),
  registrations: many(registrations),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(users, {
    fields: [registrations.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  ticketType: one(ticketTypes, {
    fields: [registrations.ticketTypeId],
    references: [ticketTypes.id],
  }),
  transaction: one(transactions, {
    fields: [registrations.id],
    references: [transactions.registrationId],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  registration: one(registrations, {
    fields: [transactions.registrationId],
    references: [registrations.id],
  }),
}));

// ─── TYPES ────────────────────────────────────────────────────────────────────
// Gunakan tipe-tipe ini di seluruh codebase, jangan redefinisi manual.

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type TicketType = typeof ticketTypes.$inferSelect;
export type NewTicketType = typeof ticketTypes.$inferInsert;

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;