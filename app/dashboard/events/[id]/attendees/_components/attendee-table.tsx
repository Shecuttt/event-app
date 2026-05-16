import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AttendeeWithRelations } from "@/src/db/queries/registrations";

interface AttendeeTableProps {
  attendees: AttendeeWithRelations[];
}

export function AttendeeTable({ attendees }: AttendeeTableProps) {
  const statusColors = {
    registered: "secondary",
    checked_in: "default",
    absent: "outline",
  } as const;

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipe Tiket</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Waktu Daftar</TableHead>
            <TableHead>Waktu Hadir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Belum ada peserta.
              </TableCell>
            </TableRow>
          ) : (
            attendees.map((attendee) => (
              <TableRow key={attendee.id}>
                <TableCell className="font-medium">{attendee.user.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{attendee.user.email}</TableCell>
                <TableCell className="text-sm">{attendee.ticketType.name}</TableCell>
                <TableCell>
                  <Badge variant={statusColors[attendee.status]} className="capitalize">
                    {attendee.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(attendee.createdAt), "dd MMM yyyy, HH:mm")}
                </TableCell>
                <TableCell className="text-sm">
                  {attendee.attendedAt 
                    ? format(new Date(attendee.attendedAt), "dd MMM yyyy, HH:mm")
                    : "-"
                  }
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
