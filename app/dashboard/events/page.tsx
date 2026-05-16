import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrganizerEvents } from "@/src/db/queries/events";
import { EventsTable } from "./_components/events-table";
import { EventsFilter } from "./_components/events-filter";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardEventsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    category?: string;
  }>;
}

export default async function DashboardEventsPage({
  searchParams,
}: DashboardEventsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isOrganizer) {
    redirect("/dashboard/tickets");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search;
  const status = params.status;
  
  const data = await getOrganizerEvents(session.user.id, {
    page,
    limit: 10,
    search,
    status,
  });

  const createPageUrl = (pageNumber: number) => {
    const newParams = new URLSearchParams();
    if (search) newParams.set("search", search);
    if (status) newParams.set("status", status);
    newParams.set("page", pageNumber.toString());
    return `/dashboard/events?${newParams.toString()}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Saya</h1>
          <p className="text-muted-foreground">
            Kelola semua event yang Anda buat.
          </p>
        </div>
        <Button render={<Link href="/dashboard/events/new" />} nativeButton={false}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Buat Event Baru
        </Button>
      </div>

      <EventsFilter />

      <EventsTable events={data.events} />

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          {data.page > 1 ? (
            <Link
              href={createPageUrl(data.page - 1)}
              className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <div className={cn(buttonVariants({ variant: "outline", size: "icon" }), "opacity-50 pointer-events-none")}>
              <ChevronLeft className="h-4 w-4" />
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
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className={cn(buttonVariants({ variant: "outline", size: "icon" }), "opacity-50 pointer-events-none")}>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
