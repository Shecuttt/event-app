import { db } from "@/src/db";
import { transactions, registrations, events, ticketTypes } from "@/src/db/schema";
import { eq, and, desc, sql, SQL } from "drizzle-orm";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface TransactionFilters {
  page?: number;
  limit?: number;
  status?: "pending" | "paid" | "cancelled" | "refunded";
}

export type TransactionWithRelations = {
  id: string;
  registrationId: string;
  amount: number;
  paymentMethod: string | null;
  midtransOrderId: string;
  status: "pending" | "paid" | "cancelled" | "refunded";
  paidAt: Date | null;
  createdAt: Date;
  registration: {
    id: string;
    event: {
      id: string;
      title: string;
    };
    ticketType: {
      name: string;
    };
  };
};

export interface PaginatedTransactionsResult {
  transactions: TransactionWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── GET TRANSACTION BY ID ──────────────────────────────────────────────────────

export async function getTransactionById(
  id: string
): Promise<TransactionWithRelations | null> {
  const result = await db
    .select({
      transaction: transactions,
      registration: {
        id: registrations.id,
      },
      event: {
        id: events.id,
        title: events.title,
      },
      ticketType: {
        name: ticketTypes.name,
      },
    })
    .from(transactions)
    .innerJoin(registrations, eq(transactions.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(eq(transactions.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { transaction, registration, event, ticketType } = result[0];

  return {
    ...transaction,
    registration: {
      id: registration.id,
      event: {
        id: event.id,
        title: event.title,
      },
      ticketType: {
        name: ticketType.name,
      },
    },
  };
}

// ─── GET TRANSACTION BY MIDTRANS ORDER ID ─────────────────────────────────────

export async function getTransactionByMidtransOrderId(
  orderId: string
): Promise<TransactionWithRelations | null> {
  const result = await db
    .select({
      transaction: transactions,
      registration: {
        id: registrations.id,
      },
      event: {
        id: events.id,
        title: events.title,
      },
      ticketType: {
        name: ticketTypes.name,
      },
    })
    .from(transactions)
    .innerJoin(registrations, eq(transactions.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(eq(transactions.midtransOrderId, orderId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { transaction, registration, event, ticketType } = result[0];

  return {
    ...transaction,
    registration: {
      id: registration.id,
      event: {
        id: event.id,
        title: event.title,
      },
      ticketType: {
        name: ticketType.name,
      },
    },
  };
}

// ─── GET TRANSACTIONS BY USER ───────────────────────────────────────────────────

export async function getTransactionsByUser(
  userId: string,
  filters: TransactionFilters = {}
): Promise<PaginatedTransactionsResult> {
  const { page = 1, limit = 10, status } = filters;
  const offset = (page - 1) * limit;

  // Build where conditions - filter by user through registrations
  const conditions: SQL<unknown>[] = [eq(registrations.userId, userId)];

  if (status) {
    conditions.push(eq(transactions.status, status));
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(transactions)
    .innerJoin(registrations, eq(transactions.registrationId, registrations.id))
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  // Query transactions with relations
  const transactionsData = await db
    .select({
      transaction: transactions,
      registration: {
        id: registrations.id,
      },
      event: {
        id: events.id,
        title: events.title,
      },
      ticketType: {
        name: ticketTypes.name,
      },
    })
    .from(transactions)
    .innerJoin(registrations, eq(transactions.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(whereClause)
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    transactions: transactionsData.map(({ transaction, registration, event, ticketType }) => ({
      ...transaction,
      registration: {
        id: registration.id,
        event: {
          id: event.id,
          title: event.title,
        },
        ticketType: {
          name: ticketType.name,
        },
      },
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── GET TRANSACTION BY REGISTRATION ID ─────────────────────────────────────────

export async function getTransactionByRegistrationId(
  registrationId: string
): Promise<TransactionWithRelations | null> {
  const result = await db
    .select({
      transaction: transactions,
      registration: {
        id: registrations.id,
      },
      event: {
        id: events.id,
        title: events.title,
      },
      ticketType: {
        name: ticketTypes.name,
      },
    })
    .from(transactions)
    .innerJoin(registrations, eq(transactions.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(eq(transactions.registrationId, registrationId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const { transaction, registration, event, ticketType } = result[0];

  return {
    ...transaction,
    registration: {
      id: registration.id,
      event: {
        id: event.id,
        title: event.title,
      },
      ticketType: {
        name: ticketType.name,
      },
    },
  };
}

// ─── GET TRANSACTION OWNER USER ID ──────────────────────────────────────────────

export async function getTransactionOwnerId(transactionId: string): Promise<string | null> {
  const result = await db
    .select({ userId: registrations.userId })
    .from(transactions)
    .innerJoin(registrations, eq(transactions.registrationId, registrations.id))
    .where(eq(transactions.id, transactionId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].userId;
}
