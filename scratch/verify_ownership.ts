import "dotenv/config";
import { db } from "../src/db";
import { users, events, ticketTypes } from "../src/db/schema";
import { requireEventOwner } from "../src/lib/auth";
import { eq } from "drizzle-orm";

async function runTest() {
  console.log("🚀 Starting Ownership Verification Test...");

  try {
    // 1. Cleanup
    await db.delete(registrations);
    await db.delete(ticketTypes);
    await db.delete(events);
    await db.delete(users);
    console.log("✅ Database cleared");
  } catch (e) {
    // Might fail if tables don't exist yet or other issues, ignore for now
  }

  // 2. Create Users
  const [userA] = await db.insert(users).values({
    name: "User A (Owner)",
    email: "owner@test.com",
    isOrganizer: true,
  }).returning();

  const [userB] = await db.insert(users).values({
    name: "User B (Stranger)",
    email: "stranger@test.com",
    isOrganizer: false,
  }).returning();

  console.log(`✅ Created users: A (${userA.id}), B (${userB.id})`);

  // 3. Create Event for User A
  const [eventA] = await db.insert(events).values({
    organizerId: userA.id,
    title: "User A's Awesome Event",
    description: "Testing ownership",
    category: "workshop",
    status: "draft",
    locationType: "online",
    locationDetail: "Zoom",
    startAt: new Date(Date.now() + 86400000),
    endAt: new Date(Date.now() + 172800000),
  }).returning();

  console.log(`✅ Created event: ${eventA.id} (Owner: User A)`);

  // 4. Test Case 1: Owner accessing their own event
  console.log("\n🧪 Test Case 1: Owner accessing their own event...");
  try {
    const result = await requireEventOwner(eventA.id, userA.id);
    console.log("✅ Success! Owner has access.");
  } catch (error: any) {
    console.log("❌ Failed! Owner should have access but got error:", error.message);
  }

  // 5. Test Case 2: Other user accessing User A's event
  console.log("\n🧪 Test Case 2: Other user accessing User A's event...");
  try {
    await requireEventOwner(eventA.id, userB.id);
    console.log("❌ Failed! Other user should NOT have access.");
  } catch (error: any) {
    if (error.message.includes("Forbidden") || error.message.includes("not the owner")) {
      console.log("✅ Success! Got expected Forbidden error:", error.message);
    } else {
      console.log("❌ Failed! Got unexpected error:", error.message);
    }
  }

  // 6. Test Case 3: Non-existent event
  console.log("\n🧪 Test Case 3: Non-existent event...");
  try {
    await requireEventOwner("non-existent-id", userA.id);
    console.log("❌ Failed! Should have thrown 404.");
  } catch (error: any) {
    if (error.message.includes("not found")) {
      console.log("✅ Success! Got expected Not Found error:", error.message);
    } else {
      console.log("❌ Failed! Got unexpected error:", error.message);
    }
  }

  console.log("\n🏁 Verification Complete.");
  process.exit(0);
}

// Helper to handle registrations import if needed
const registrations = require("../src/db/schema").registrations;

runTest().catch((err) => {
  console.error("💥 Test crashed:", err);
  process.exit(1);
});
