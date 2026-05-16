import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRegistrationsByUser } from "@/src/db/queries/registrations";
import { TicketList } from "./_components/ticket-list";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft as IconLeft, ChevronRight as IconRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyTicketsPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function MyTicketsPage({ searchParams }: MyTicketsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const filters = await searchParams;
  const page = parseInt(filters.page || "1");

  const data = await getRegistrationsByUser(session.user.id, {
    page,
    limit: 9,
  });

  const createPageUrl = (pageNumber: number) => {
    return `/dashboard/tickets?page=${pageNumber}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tiket Saya</h1>
        <p className="text-muted-foreground">
          Kelola tiket dan riwayat pemesanan Anda.
        </p>
      </div>

      <TicketList tickets={data.registrations} />

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          {data.page > 1 ? (
            <Link
              href={createPageUrl(data.page - 1)}
              className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
            >
              <IconLeft className="h-4 w-4" />
            </Link>
          ) : (
            <div className={cn(buttonVariants({ variant: "outline", size: "icon" }), "opacity-50 pointer-events-none")}>
              <IconLeft className="h-4 w-4" />
            </div>
          )}

          <div className="text-sm font-medium">
            Halaman {data.page} dari {data.totalPages}
          </div>

          {data.page < data.totalPages ? (
            <Link
              href={createPageUrl(data.page + 1)}
              className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
            >
              <IconRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className={cn(buttonVariants({ variant: "outline", size: "icon" }), "opacity-50 pointer-events-none")}>
              <IconRight className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
