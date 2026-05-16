import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Info } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import type { EventWithRelations } from "@/src/db/queries/events";

interface EventHeaderProps {
  event: EventWithRelations;
}

export function EventHeader({ event }: EventHeaderProps) {
  return (
    <div className="space-y-8">
      {/* Poster Image */}
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border bg-muted">
        {event.posterUrl ? (
          <Image
            src={event.posterUrl}
            alt={event.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Calendar className="h-20 w-20 text-muted-foreground opacity-10" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <Badge className="capitalize text-sm px-3 py-1">{event.category}</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              {event.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground border-y py-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Waktu</p>
                <p>{format(new Date(event.startAt), "dd MMMM yyyy, HH:mm")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Lokasi</p>
                <p>{event.locationType === "online" ? "Online Event" : event.locationDetail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Penyelenggara</p>
                <p>{event.organizer.name}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Info className="h-6 w-6 text-primary" />
              Deskripsi Event
            </h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none prose-p:leading-relaxed">
              <ReactMarkdown>{event.description}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Sidebar (Place holder for TicketSection in page.tsx) */}
        <div className="lg:col-span-1" id="ticket-section-container">
          {/* TicketSection will be rendered here via page.tsx layout */}
        </div>
      </div>
    </div>
  );
}
