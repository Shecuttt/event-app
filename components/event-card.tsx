import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { EventWithRelations } from "@/src/db/queries/events";

interface EventCardProps {
  event: EventWithRelations;
  priority?: boolean;
}

export function EventCard({ event, priority }: EventCardProps) {
  // Get lowest price from ticket types
  const prices = event.ticketTypes.map((tt) => tt.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const isFree = minPrice === 0;

  const formattedPrice = isFree
    ? "Gratis"
    : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(minPrice);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow duration-300">
        <div className="relative aspect-video w-full">
          {event.posterUrl ? (
            <Image
              src={event.posterUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Calendar className="w-12 h-12 text-muted-foreground opacity-20" />
            </div>
          )}
          <Badge className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 capitalize">
            {event.category}
          </Badge>
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-lg line-clamp-2 leading-tight min-h-[3rem]">
            {event.title}
          </h3>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{format(new Date(event.startAt), "dd MMMM yyyy, HH:mm")}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">
                {event.locationType === "online" ? "Online" : event.locationDetail}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <div className="font-semibold text-primary">
            {formattedPrice}
          </div>
          <div className="text-xs text-muted-foreground">
            {event.organizer.name}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
