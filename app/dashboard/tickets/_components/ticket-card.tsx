import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, MapPin } from "lucide-react";
import Image from "next/image";
import { RegistrationWithRelations } from "@/src/db/queries/registrations";
import { QrCodeDisplay } from "./qr-code-display";

interface TicketCardProps {
  ticket: RegistrationWithRelations;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const statusColors = {
    registered: "default",
    checked_in: "secondary",
    absent: "outline",
  } as const;

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative aspect-video w-full bg-muted">
        {ticket.event.posterUrl ? (
          <Image
            src={ticket.event.posterUrl}
            alt={ticket.event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No Poster
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant={statusColors[ticket.status]} className="capitalize shadow-sm">
            {ticket.status.replace("_", " ")}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg line-clamp-1">{ticket.event.title}</CardTitle>
        <div className="text-sm font-medium text-primary mt-1">
          {ticket.ticketType.name}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(ticket.event.startAt), "dd MMM yyyy, HH:mm")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">
              {ticket.event.locationType === "online" ? "Online Streaming" : ticket.event.locationDetail}
            </span>
          </div>
        </div>

        <QrCodeDisplay registration={ticket} />
      </CardContent>
    </Card>
  );
}
