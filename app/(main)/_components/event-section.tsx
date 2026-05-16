import { getPublishedEvents } from "@/src/db/queries/events";
import { EventCard } from "@/components/event-card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export async function EventSection() {
  const { events } = await getPublishedEvents({ limit: 6, sort: "createdAt_desc" });

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Event Terbaru</h2>
            <p className="mt-2 text-muted-foreground">
              Jangan lewatkan event-event menarik yang baru saja ditambahkan.
            </p>
          </div>
          <Link
            href="/events"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden sm:flex"
            )}
          >
            Lihat Semua
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        <div className="mt-12 flex justify-center sm:hidden">
          <Link
            href="/events"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Lihat Semua Event
          </Link>
        </div>
      </div>
    </section>
  );
}
