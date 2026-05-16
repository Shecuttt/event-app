"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, QrCode } from "lucide-react";
import { toast } from "sonner";
import { checkInAttendee } from "@/src/actions/check-in";

export function CheckinButton() {
  const [open, setOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCode.trim()) return;

    setIsLoading(true);
    try {
      const result = await checkInAttendee(qrCode);
      if (result.success) {
        toast.success(`Berhasil check-in: ${result.attendee.name}`, {
          description: `Tiket: ${result.attendee.ticketType}`,
        });
        setQrCode("");
        setOpen(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal melakukan check-in";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        <Scan className="mr-2 h-4 w-4" />
        Check-in Peserta
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Check-in Manual</DialogTitle>
          <DialogDescription>
            Masukkan kode QR peserta secara manual untuk melakukan check-in.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCheckIn} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="qrcode">Kode QR Tiket</Label>
            <div className="relative">
              <QrCode className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="qrcode"
                placeholder="EVT-..."
                className="pl-9"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !qrCode.trim()}>
            {isLoading ? "Memproses..." : "Konfirmasi Check-in"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
