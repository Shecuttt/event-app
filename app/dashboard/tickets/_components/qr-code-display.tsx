"use client";

import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RegistrationWithRelations } from "@/src/db/queries/registrations";
import { Calendar, Clock, MapPin, User, Tag, Mail } from "lucide-react";

interface QrCodeDisplayProps {
  registration: RegistrationWithRelations;
}

export function QrCodeDisplay({ registration }: QrCodeDisplayProps) {
  const statusColors = {
    registered: "default",
    checked_in: "secondary",
    absent: "outline",
  } as const;

  return (
    <Dialog>
      <DialogTrigger className="w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        Lihat QR Code
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-2 border-primary/20">
        <div className="bg-primary text-primary-foreground p-6 text-center space-y-2">
          <DialogTitle className="text-2xl font-bold">E-Ticket Ivento</DialogTitle>
          <p className="text-primary-foreground/80 text-sm">
            Tunjukkan QR Code ini kepada panitia di lokasi event.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-muted/30 border-b border-dashed">
          {registration.qrCode ? (
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <QRCodeSVG value={registration.qrCode} size={200} />
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="bg-destructive/10 text-destructive rounded-md p-4 text-sm font-medium">
                QR Code belum tersedia.
                {registration.ticketType.price > 0 && " Harap selesaikan pembayaran."}
              </div>
            </div>
          )}
          <p className="mt-4 font-mono text-sm tracking-widest text-muted-foreground uppercase">
            {registration.id.split("-")[0]}
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-1 text-center">
            <Badge variant={statusColors[registration.status]} className="capitalize">
              {registration.status.replace("_", " ")}
            </Badge>
            <h2 className="text-xl font-bold">{registration.event.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <p className="text-sm font-medium">
                    {format(new Date(registration.event.startAt), "eeee, dd MMMM yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Waktu</p>
                  <p className="text-sm font-medium">
                    {format(new Date(registration.event.startAt), "HH:mm")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lokasi</p>
                  <p className="text-sm font-medium">
                    {registration.event.locationType === "online"
                      ? "Online Streaming"
                      : registration.event.locationDetail}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nama Peserta</p>
                  <p className="text-sm font-medium">{registration.user?.name || "Anonymous"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipe Tiket</p>
                  <p className="text-sm font-medium">{registration.ticketType.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{registration.user?.email || "No email"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
