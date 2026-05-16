import { NextResponse } from "next/server";
import { getSession } from "@/src/lib/auth";
import { getTransactionById, getTransactionOwnerId } from "@/src/db/queries/transactions";

// ─── CACHE CONFIGURATION ──────────────────────────────────────────────────────

// Short cache for polling endpoint (5 seconds to match polling interval)
const CACHE_CONTROL = "private, no-store, max-age=5";

// ─── GET /api/v1/transactions/[id]/status ────────────────────────────────────

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 1. Auth required
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu untuk melanjutkan" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // 2. Check if user is the owner of the transaction
    const ownerId = await getTransactionOwnerId(id);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (ownerId !== userId) {
      return NextResponse.json(
        { error: "Forbidden - Anda tidak memiliki akses ke transaksi ini" },
        { status: 403 }
      );
    }

    // 3. Get transaction details (minimal payload for polling)
    const transaction = await getTransactionById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Return minimal data for polling
    return NextResponse.json(
      {
        transactionId: transaction.id,
        status: transaction.status,
        midtransOrderId: transaction.midtransOrderId,
      },
      {
        headers: {
          "Cache-Control": CACHE_CONTROL,
        },
      }
    );
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return NextResponse.json(
      { error: "Gagal mengambil status transaksi" },
      { status: 500 }
    );
  }
}
