import midtransClient from "midtrans-client";
import { createHash } from "crypto";

// ─── INITIALIZATION ───────────────────────────────────────────────────────────

const serverKey = process.env.MIDTRANS_SERVER_KEY;
const clientKey = process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

if (!serverKey) {
  throw new Error("MIDTRANS_SERVER_KEY environment variable is required");
}

if (!clientKey) {
  throw new Error("MIDTRANS_CLIENT_KEY or NEXT_PUBLIC_MIDTRANS_CLIENT_KEY environment variable is required");
}

// Initialize Snap client for sandbox (isProduction: false)
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: serverKey,
  clientKey: clientKey,
});

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CustomerDetails {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
}

export interface SnapTransactionResult {
  snapToken: string;
  redirectUrl: string;
}

export interface WebhookPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  payment_type?: string;
  transaction_time?: string;
  transaction_id?: string;
  fraud_status?: string;
  [key: string]: string | undefined;
}

// ─── CREATE SNAP TRANSACTION ────────────────────────────────────────────────────

/**
 * Create a Snap transaction with Midtrans
 * @param orderId Unique order ID (format: IVENTO-{registrationId})
 * @param amount Transaction amount in Rupiah
 * @param customerDetails Customer information
 * @returns snapToken and redirectUrl for payment
 */
export async function createSnapTransaction(
  orderId: string,
  amount: number,
  customerDetails: CustomerDetails
): Promise<SnapTransactionResult> {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    customer_details: {
      first_name: customerDetails.firstName,
      last_name: customerDetails.lastName || "",
      email: customerDetails.email,
      phone: customerDetails.phone || "",
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return {
      snapToken: transaction.token,
      redirectUrl: transaction.redirect_url,
    };
  } catch (error) {
    console.error("Error creating Midtrans transaction:", error);
    throw new Error("Failed to create payment transaction");
  }
}

// ─── VERIFY WEBHOOK SIGNATURE ───────────────────────────────────────────────────

/**
 * Verify webhook signature from Midtrans
 * Formula: SHA512(orderId + statusCode + grossAmount + serverKey)
 * @param payload Webhook payload from Midtrans
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(payload: WebhookPayload): boolean {
  const { order_id, status_code, gross_amount, signature_key } = payload;

  if (!signature_key || !order_id || !status_code || !gross_amount) {
    return false;
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    console.error("MIDTRANS_SERVER_KEY not found in environment");
    return false;
  }

  // Build signature string: orderId + statusCode + grossAmount + serverKey
  const signatureString = `${order_id}${status_code}${gross_amount}${serverKey}`;

  // Generate SHA512 hash
  const expectedSignature = createHash("sha512").update(signatureString).digest("hex");

  // Compare signatures (case-insensitive as Midtrans may send uppercase)
  return signature_key.toLowerCase() === expectedSignature.toLowerCase();
}

// ─── GET SERVER KEY ─────────────────────────────────────────────────────────────

/**
 * Get Midtrans server key (for external use if needed)
 * @returns serverKey
 */
export function getServerKey(): string {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) {
    throw new Error("MIDTRANS_SERVER_KEY not found");
  }
  return key;
}
