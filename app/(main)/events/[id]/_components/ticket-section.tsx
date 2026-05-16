"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShoppingCart, Loader2 } from "lucide-react";
import { registerEvent } from "@/src/actions/registrations";
import { initiatePayment } from "@/src/actions/payments";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EventWithRelations } from "@/src/db/queries/events";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface TicketSectionProps {
  event: EventWithRelations;
}

export function TicketSection({ event }: TicketSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    event.ticketTypes.length > 0 ? event.ticketTypes[0].id : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedTicket = event.ticketTypes.find((t) => t.id === selectedTicketId);

  const handleRegistration = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (!selectedTicketId || !selectedTicket) return;

    setIsLoading(true);
    try {
      if (selectedTicket.price === 0) {
        // Free Event Flow
        const result = await registerEvent(event.id, selectedTicketId);
        if (result.success) {
          setIsSuccess(true);
          toast.success("Berhasil mendaftar event!");
          router.refresh();
        }
      } else {
        // Paid Event Flow
        const result = await initiatePayment(event.id, selectedTicketId);
        if (result.paymentUrl) {
          toast.info("Mengarahkan ke halaman pembayaran...");
          window.location.href = result.paymentUrl;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat mendaftar";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="sticky top-24 border-primary/50 bg-primary/5">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Terdaftar!</CardTitle>
          <CardDescription>
            Anda telah berhasil terdaftar untuk event ini.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            className="w-full"
            render={<Link href="/dashboard/tickets" />}
            nativeButton={false}
          >
            Lihat Tiket Saya
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="sticky top-24 shadow-lg">
      <CardHeader>
        <CardTitle>Pilih Tiket</CardTitle>
        <CardDescription>Pilih tipe tiket yang sesuai untuk Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {event.ticketTypes.map((ticket) => {
          const isSelected = selectedTicketId === ticket.id;
          const isSoldOut = ticket.soldCount >= ticket.quota;

          return (
            <div
              key={ticket.id}
              onClick={() => !isSoldOut && setSelectedTicketId(ticket.id)}
              className={`
                relative cursor-pointer rounded-lg border-2 p-4 transition-all
                ${isSelected ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"}
                ${isSoldOut ? "opacity-50 cursor-not-allowed grayscale" : ""}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{ticket.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.price === 0
                      ? "Gratis"
                      : new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(ticket.price)}
                  </p>
                </div>
                {isSoldOut ? (
                  <Badge variant="destructive">Habis</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Sisa {ticket.quota - ticket.soldCount}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}

        {event.ticketTypes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm italic">
            Belum ada tiket tersedia.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          className="w-full h-12 text-lg"
          onClick={handleRegistration}
          disabled={isLoading || !selectedTicketId || (selectedTicket?.soldCount ?? 0) >= (selectedTicket?.quota ?? 0)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Memproses...
            </>
          ) : !session ? (
            "Login untuk Daftar"
          ) : selectedTicket?.price === 0 ? (
            "Daftar Sekarang"
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Beli Tiket
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground">
          Dengan mendaftar, Anda menyetujui Syarat & Ketentuan Ivento.
        </p>
      </CardFooter>
    </Card>
  );
}
