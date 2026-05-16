import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getEventWithOwnerCheck } from "@/src/db/queries/events";
import { getAttendeesByEvent } from "@/src/db/queries/registrations";
import { AttendeeTable } from "./_components/attendee-table";
import { AttendeeFilter } from "./_components/attendee-filter";
import { CheckinButton } from "./_components/checkin-button";
import { ExportButton } from "./_components/export-button";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendeeListPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}

export default async function AttendeeListPage({
  params,
  searchParams,
}: AttendeeListPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const event = await getEventWithOwnerCheck(id, session.user.id);

  if (!event) {
    notFound();
  }

  const filters = await searchParams;
  const page = parseInt(filters.page || "1");
  const status = filters.status as "registered" | "checked_in" | "absent" | undefined;

  const data = await getAttendeesByEvent(id, {
    page,
    limit: 10,
    status,
  });

  const createPageUrl = (pageNumber: number) => {
    const newParams = new URLSearchParams();
    if (status) newParams.set("status", status);
    newParams.set("page", pageNumber.toString());
    return `/dashboard/events/${id}/attendees?${newParams.toString()}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/events" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4 inline mr-1" />
              Event Saya
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Peserta</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Daftar Peserta</h1>
          <p className="text-muted-foreground">
            {event.title}
          </p>
        </div>

        <div className="flex gap-2">
          <CheckinButton />
          <ExportButton eventId={id} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <AttendeeFilter />
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{data.total}</span> peserta
        </div>
      </div>

      <AttendeeTable attendees={data.attendees} />

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
