import { getPublishedEvents } from "@/src/db/queries/events";
import { EventFilters } from "./_components/event-filters";
import { EventGrid } from "./_components/event-grid";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface EventsPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  
  const filters = {
    page: params.page ? parseInt(params.page) : 1,
    limit: 9,
    search: params.search,
    category: params.category === "all" ? undefined : params.category,
    locationType: params.locationType === "all" ? undefined : params.locationType as "offline" | "online",
    type: params.type === "all" ? undefined : params.type as "free" | "paid",
  };

  const data = await getPublishedEvents(filters);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Jelajahi Event</h1>
        <p className="text-muted-foreground mt-2">
          Temukan berbagai event menarik dari berbagai kategori.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <EventFilters />
          </div>
        </aside>

        {/* Main Content (Grid) */}
        <main className="lg:col-span-3">
          <Suspense fallback={<EventGridSkeleton />}>
            <EventGrid data={data} searchParams={params} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function EventGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
