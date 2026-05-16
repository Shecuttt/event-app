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
import { Edit, Users } from "lucide-react";

interface RecentEventsTableProps {
  events: {
    id: string;
    title: string;
    status: "draft" | "published" | "cancelled" | "completed";
    startAt: Date;
    attendeeCount: number;
  }[];
}

export function RecentEventsTable({ events }: RecentEventsTableProps) {
  const statusColors = {
    draft: "secondary",
    published: "default",
    cancelled: "destructive",
    completed: "outline",
  } as const;

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Judul</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Peserta</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Belum ada event.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>
                  <Badge variant={statusColors[event.status]} className="capitalize">
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(event.startAt), "dd MMM yyyy")}
                </TableCell>
                <TableCell>{event.attendeeCount}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" render={<Link href={`/dashboard/events/${event.id}/edit`} />} nativeButton={false}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" render={<Link href={`/dashboard/events/${event.id}/attendees`} />} nativeButton={false}>
                      <Users className="h-4 w-4" />
                      <span className="sr-only">Peserta</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
