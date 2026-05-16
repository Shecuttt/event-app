import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "../src/db/schema";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding database...");

  // 1. Create a dummy organizer
  let organizer;
  const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, "organizer@ivento.com")).limit(1);
  
  if (existingUser.length > 0) {
    organizer = existingUser[0];
    console.log(`Using existing organizer: ${organizer.email}`);
  } else {
    const [newOrganizer] = await db.insert(schema.users).values({
      name: "Ivento Organizer",
      email: "organizer@ivento.com",
      isOrganizer: true,
    }).returning();
    organizer = newOrganizer;
    console.log(`Created organizer: ${organizer.email}`);
  }

  // Clean up existing events by this organizer to avoid duplicates
  await db.delete(schema.events).where(eq(schema.events.organizerId, organizer.id));
  console.log("Cleaned up existing events for this organizer.");

  // 2. Create Events
  const eventData = [
    {
      title: "Jakarta Music Festival 2026",
      description: "Konser musik terbesar tahun ini yang menghadirkan artis lokal dan internasional terbaik. Jangan lewatkan keseruannya!",
      category: "music" as const,
      status: "published" as const,
      locationType: "offline" as const,
      locationDetail: "Gelora Bung Karno, Jakarta",
      startAt: new Date("2026-08-15T19:00:00Z"),
      endAt: new Date("2026-08-15T23:00:00Z"),
      posterUrl: "https://images.unsplash.com/photo-1459749411177-042180ce673c?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "AI & Future Tech Seminar",
      description: "Pelajari bagaimana Kecerdasan Buatan mengubah dunia kerja dan peluang masa depan dalam seminar eksklusif ini.",
      category: "seminar" as const,
      status: "published" as const,
      locationType: "online" as const,
      locationDetail: "Zoom Meeting (Link akan dikirim via email)",
      startAt: new Date("2026-06-20T10:00:00Z"),
      endAt: new Date("2026-06-20T12:00:00Z"),
      posterUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Morning Yoga & Meditation",
      description: "Mulailah pagimu dengan energi positif melalui sesi yoga dan meditasi bersama instruktur berpengalaman.",
      category: "sport" as const,
      status: "published" as const,
      locationType: "offline" as const,
      locationDetail: "Taman Menteng, Jakarta",
      startAt: new Date("2026-05-25T06:00:00Z"),
      endAt: new Date("2026-05-25T08:00:00Z"),
      posterUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2120&auto=format&fit=crop",
    },
    {
      title: "UX Design Workshop: From Zero to Hero",
      description: "Workshop intensif selama satu hari untuk mempelajari dasar-dasar User Experience Design dan tools Figma.",
      category: "workshop" as const,
      status: "published" as const,
      locationType: "online" as const,
      locationDetail: "Google Meet",
      startAt: new Date("2026-07-05T13:00:00Z"),
      endAt: new Date("2026-07-05T17:00:00Z"),
      posterUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?q=80&w=2070&auto=format&fit=crop",
    },
    {
      title: "Komunitas Pecinta Kopi Indonesia",
      description: "Temu kangen komunitas pecinta kopi, berbagi tips menyeduh, dan mencicipi berbagai biji kopi pilihan nusantara.",
      category: "community" as const,
      status: "published" as const,
      locationType: "offline" as const,
      locationDetail: "Senayan City, Jakarta",
      startAt: new Date("2026-09-10T15:00:00Z"),
      endAt: new Date("2026-09-10T18:00:00Z"),
      posterUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop",
    },
  ];

  for (const event of eventData) {
    const [insertedEvent] = await db.insert(schema.events).values({
      ...event,
      organizerId: organizer.id,
    }).returning();

    console.log(`Created event: ${insertedEvent.title}`);

    // 3. Create Ticket Types for each event
    if (event.title === "Jakarta Music Festival 2026") {
      await db.insert(schema.ticketTypes).values([
        { eventId: insertedEvent.id, name: "Regular", price: 250000, quota: 500 },
        { eventId: insertedEvent.id, name: "VIP", price: 750000, quota: 100 },
      ]);
    } else if (event.title === "AI & Future Tech Seminar") {
      await db.insert(schema.ticketTypes).values([
        { eventId: insertedEvent.id, name: "Early Bird", price: 50000, quota: 50 },
        { eventId: insertedEvent.id, name: "General Admission", price: 100000, quota: 200 },
      ]);
    } else if (event.title === "Morning Yoga & Meditation") {
      await db.insert(schema.ticketTypes).values([
        { eventId: insertedEvent.id, name: "Gratis", price: 0, quota: 30 },
      ]);
    } else {
      await db.insert(schema.ticketTypes).values([
        { eventId: insertedEvent.id, name: "Standard", price: 150000, quota: 50 },
      ]);
    }
  }

  console.log("Seeding completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:");
  console.error(err);
  process.exit(1);
});
