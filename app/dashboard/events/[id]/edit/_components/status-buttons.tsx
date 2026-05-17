"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, PowerOff } from "lucide-react";
import { updateEvent } from "@/src/actions/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface StatusButtonsProps {
  eventId: string;
  status: string;
}

export function StatusButtons({ eventId, status }: StatusButtonsProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleUpdateStatus = async (newStatus: "published" | "cancelled") => {
    setIsPending(true);
    try {
      const result = await updateEvent(eventId, { status: newStatus });
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Event berhasil ${newStatus === "published" ? "dipublikasikan" : "dibatalkan"}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengubah status event";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {status === "draft" && (
        <Button 
          variant="default" 
          onClick={() => handleUpdateStatus("published")}
          disabled={isPending}
        >
          <Rocket className="mr-2 h-4 w-4" />
          {isPending ? "Memproses..." : "Publikasikan"}
        </Button>
      )}
      {status === "published" && (
        <Button 
          variant="destructive" 
          onClick={() => handleUpdateStatus("cancelled")}
          disabled={isPending}
        >
          <PowerOff className="mr-2 h-4 w-4" />
          {isPending ? "Memproses..." : "Batalkan Event"}
        </Button>
      )}
    </div>
  );
}
