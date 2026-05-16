"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  eventId: string;
}

export function ExportButton({ eventId }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/v1/events/${eventId}/attendees/export`);
      
      if (!response.ok) {
        throw new Error("Gagal mengunduh file CSV");
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger the download
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      // You could extract the filename from the Content-Disposition header if needed
      a.download = `peserta-event-${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("File CSV berhasil diunduh");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor data peserta");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting}>
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      {isExporting ? "Mengekspor..." : "Export CSV"}
    </Button>
  );
}
