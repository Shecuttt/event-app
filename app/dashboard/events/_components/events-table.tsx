import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { Edit, Users, MoreHorizontal, Eye } from "lucide-react";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EventWithRelations } from "@/src/db/queries/events";

interface EventsTableProps {
  events: EventWithRelations[];
}

export function EventsTable({ events }: EventsTableProps) {
  const statusColors = {
    draft: "secondary",
    published: "default",
    cancelled: "destructive",
    completed: "outline",
  } as const;

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Poster</TableHead>
            <TableHead>Judul Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Waktu Pelaksanaan</TableHead>
            <TableHead>Terjual / Kuota</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Tidak ada event yang ditemukan.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => {
              const totalQuota = event.ticketTypes.reduce((acc, tt) => acc + tt.quota, 0);
              const totalSold = event.ticketTypes.reduce((acc, tt) => acc + tt.soldCount, 0);
              
              return (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="relative aspect-square w-12 overflow-hidden rounded-md border bg-muted">
                      {event.posterUrl ? (
                        <Image
                          src={event.posterUrl}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-[10px] text-muted-foreground">No Image</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {event.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[event.status]} className="capitalize">
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(event.startAt), "dd MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {totalSold} / {totalQuota || "∞"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                        <DropdownMenuItem render={<Link href={`/events/${event.id}`} target="_blank" />}>
                          <Eye className="mr-2 h-4 w-4" />
                          Lihat Publik
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem render={<Link href={`/dashboard/events/${event.id}/edit`} />}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href={`/dashboard/events/${event.id}/attendees`} />}>
                          <Users className="mr-2 h-4 w-4" />
                          Kelola Peserta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
