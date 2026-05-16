import { EventCard } from "@/components/event-card";
import { PaginatedEventsResult } from "@/src/db/queries/events";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventGridProps {
  data: PaginatedEventsResult;
  searchParams: Record<string, string | undefined>;
}

export function EventGrid({ data, searchParams }: EventGridProps) {
  const { events, totalPages, page } = data;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-xl font-bold">Tidak ada event ditemukan</h3>
        <p className="text-muted-foreground mt-2">
          Coba ganti filter atau kata kunci pencarianmu.
        </p>
      </div>
    );
  }

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", pageNumber.toString());
    return `/events?${params.toString()}`;
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event, index) => (
          <EventCard 
            key={event.id} 
            event={event} 
            priority={index < 3}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link
              href={createPageUrl(page - 1)}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" })
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <div
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "opacity-50 pointer-events-none"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </div>
          )}

          <div className="text-sm font-medium">
            Halaman {page} dari {totalPages}
          </div>

          {page < totalPages ? (
            <Link
              href={createPageUrl(page + 1)}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" })
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <div
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "opacity-50 pointer-events-none"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
