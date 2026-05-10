import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { transactions, registrations, ticketTypes } from "@/src/db/schema";
import { verifyWebhookSignature, type WebhookPayload } from "@/src/lib/midtrans";
import { getTransactionByMidtransOrderId } from "@/src/db/queries/transactions";
import { eq, and, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

// ─── POST /api/v1/transactions/webhook ────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Parse webhook payload
    let payload: WebhookPayload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Verify signature - no Bearer token, use signature verification
    const isValid = verifyWebhookSignature(payload);
    if (!isValid) {
      console.error("Invalid webhook signature:", {
        orderId: payload.order_id,
        receivedSignature: payload.signature_key,
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const {
      order_id: orderId,
      transaction_status: transactionStatus,
      payment_type: paymentType,
    } = payload;

    // Log webhook received for debugging
    console.log("Webhook received:", {
      orderId,
      transactionStatus,
      paymentType,
    });

    // Get transaction by order ID
    const transaction = await getTransactionByMidtransOrderId(orderId);
    if (!transaction) {
      console.error("Transaction not found for order:", orderId);
      // Return 200 to prevent Midtrans from retrying indefinitely
      // This is important: non-200 will trigger retries
      return NextResponse.json(
        { message: "Transaction not found" },
        { status: 200 }
      );
    }

    const registrationId = transaction.registrationId;

    // Handle transaction status
    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      // Payment successful - update to paid and generate QR code
      await db.transaction(async (tx) => {
        // Generate QR code: IVENTO-{registrationId}-{randomHash6char}
        const randomHash = randomBytes(3).toString("hex").toUpperCase();
        const qrCode = `IVENTO-${registrationId}-${randomHash}`;

        // Update transaction to paid
        await tx
          .update(transactions)
          .set({
            status: "paid",
            paidAt: new Date(),
            paymentMethod: paymentType || null,
          })
          .where(eq(transactions.id, transaction.id));

        // Update registration with QR code
        await tx
          .update(registrations)
          .set({
            qrCode: qrCode,
          })
          .where(eq(registrations.id, registrationId));
      });

      console.log("Payment successful, QR code generated:", {
        orderId,
        registrationId,
      });

      return NextResponse.json(
        { message: "Payment processed successfully" },
        { status: 200 }
      );

    } else if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire"
    ) {
      // Payment failed/cancelled - update to cancelled, decrement soldCount
      await db.transaction(async (tx) => {
        // Get the ticketTypeId from registration to decrement soldCount
        const registrationResult = await tx
          .select({ ticketTypeId: registrations.ticketTypeId })
          .from(registrations)
          .where(eq(registrations.id, registrationId))
          .limit(1);

        if (registrationResult.length > 0) {
          const { ticketTypeId } = registrationResult[0];

          // Decrement soldCount in ticketTypes
          await tx
            .update(ticketTypes)
            .set({
              soldCount: sql`${ticketTypes.soldCount} - 1`,
            })
            .where(eq(ticketTypes.id, ticketTypeId));
        }

        // Update transaction to cancelled
        await tx
          .update(transactions)
          .set({
            status: "cancelled",
          })
          .where(eq(transactions.id, transaction.id));

        // Update registration to absent
        await tx
          .update(registrations)
          .set({
            status: "absent",
          })
          .where(eq(registrations.id, registrationId));
      });

      console.log("Payment cancelled/failed:", {
        orderId,
        registrationId,
        reason: transactionStatus,
      });

      return NextResponse.json(
        { message: "Payment cancelled processed" },
        { status: 200 }
      );

    } else {
      // Other statuses: pending, etc. - just log
      console.log("Unhandled transaction status:", {
        orderId,
        transactionStatus,
      });

      return NextResponse.json(
        { message: "Status logged" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    // Always return 200 to prevent Midtrans from retrying
    // Midtrans will retry indefinitely for non-200 responses
    return NextResponse.json(
      { message: "Webhook received" },
      { status: 200 }
    );
  }
}
