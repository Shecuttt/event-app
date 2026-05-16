import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Ticket as TicketIcon } from "lucide-react";
import { RegistrationWithRelations } from "@/src/db/queries/registrations";
import { TicketCard } from "./ticket-card";

interface TicketListProps {
  tickets: RegistrationWithRelations[];
}

export function TicketList({ tickets }: TicketListProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tickets.length === 0 ? (
        <div className="col-span-full h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
          <TicketIcon className="h-10 w-10 mb-2 opacity-20" />
          <p>Belum ada tiket yang dipesan.</p>
          <Button variant="link" render={<Link href="/events" />} nativeButton={false}>
            Cari event menarik
          </Button>
        </div>
      ) : (
        tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))
      )}
    </div>
  );
}
