import { useState } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManualCheckInProps {
  onSubmit: (
    ticketId: string
  ) => Promise<{ success: boolean; message: string }>;
  onClose: () => void;
}

export default function ManualCheckIn({
  onSubmit,
  onClose,
}: ManualCheckInProps) {
  const [ticketId, setTicketId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) return;

    setIsLoading(true);
    setError(null);

    const result = await onSubmit(ticketId.trim().toUpperCase());

    setIsLoading(false);

    if (result.success) {
      // Close modal on success
      onClose();
    } else {
      // Show error in modal
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Manual Check-In</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticketId">Ticket ID</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="ticketId"
                type="text"
                placeholder="TIX-XXXXX"
                value={ticketId}
                onChange={(e) => {
                  setTicketId(e.target.value.toUpperCase());
                  setError(null); // Clear error on input
                }}
                className="pl-10"
                autoFocus
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Ketik ticket ID peserta (cek di list atau minta peserta)
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!ticketId.trim() || isLoading}
          >
            {isLoading ? "Checking in..." : "Check In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
