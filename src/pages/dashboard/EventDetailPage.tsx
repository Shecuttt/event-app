/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Edit,
  Share2,
  MoreVertical,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Keyboard,
  QrCode,
} from "lucide-react";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Tables } from "@/types/database.types";
import QRScanner from "@/components/QRScanner";
import ManualCheckIn from "@/components/ManualCheckIn";

type Event = Tables<"events">;
type Participant = Tables<"participants">;

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copySuccess, setCopySuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualCheckIn, setShowManualCheckIn] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id as string)
        .single();

      if (error) throw error;
      return data as Event;
    },
  });

  // Fetch participants
  const { data: participants = [] } = useQuery({
    queryKey: ["participants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("event_id", id as string)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Participant[];
    },
  });

  const handleCopyLink = () => {
    const link = `${window.location.origin}/e/${event?.slug}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDeleteEvent = async () => {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id as string);

    await queryClient.invalidateQueries({ queryKey: ["events"] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });

    if (!error) {
      navigate("/dashboard/events");
    }
  };

  const handleToggleStatus = async (newStatus: string) => {
    const { error } = await supabase
      .from("events")
      .update({ status: newStatus })
      .eq("id", id as string);

    if (!error) {
      window.location.reload();
    }
  };

  const handleExportCSV = () => {
    if (!participants.length) return;

    const headers = [
      "Nama",
      "Email",
      "Phone",
      "Ticket ID",
      "Status",
      "Check-in Time",
      "Registered At",
    ];
    const rows = participants.map((p) => [
      p.name,
      p.email || "-",
      p.phone || "-",
      p.ticket_id,
      p.attendance_status,
      p.checked_in_at
        ? format(new Date(p.checked_in_at as string), "PPpp", {
            locale: localeId,
          })
        : "-",
      format(new Date(p.created_at as string), "PPpp", { locale: localeId }),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.slug}-participants.csv`;
    a.click();
  };

  const handleCheckIn = async (
    ticketId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Find participant by ticket ID
      const participant = participants.find((p) => p.ticket_id === ticketId);

      if (!participant) {
        return {
          success: false,
          message: `Ticket ID ${ticketId} tidak ditemukan di event ini.`,
        };
      }

      if (participant.attendance_status === "present") {
        return {
          success: false,
          message: `${participant.name} udah check-in sebelumnya.`,
        };
      }

      // Update attendance status
      const { error } = await supabase
        .from("participants")
        .update({
          attendance_status: "present",
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", participant.id);

      if (error) throw error;

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["participants", id] });
      await queryClient.invalidateQueries({ queryKey: ["event", id] });

      const successMessage = `✅ ${participant.name} berhasil check-in!`;

      setCheckInStatus({
        type: "success",
        message: successMessage,
      });

      // Close modals
      setShowScanner(false);
      setShowManualCheckIn(false);

      // Clear status after 3 seconds
      setTimeout(() => setCheckInStatus(null), 3000);

      return { success: true, message: successMessage };
    } catch (err: any) {
      const errorMessage = err.message || "Gagal check-in. Coba lagi.";

      setCheckInStatus({
        type: "error",
        message: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Event tidak ditemukan</p>
      </div>
    );
  }

  const registeredCount = participants.length;
  const attendedCount = participants.filter(
    (p) => p.attendance_status === "present"
  ).length;
  const publicLink = `${window.location.origin}/e/${event.slug}`;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/events")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Events
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {event.title}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  event.status === "active"
                    ? "bg-green-100 text-green-700"
                    : event.status === "closed"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {event.status === "active"
                  ? "Aktif"
                  : event.status === "closed"
                  ? "Ditutup"
                  : "Dibatalkan"}
              </span>
            </div>
            <p className="text-gray-600">
              Dibuat{" "}
              {format(new Date(event.created_at as string), "PPP", {
                locale: localeId,
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCopyLink} variant="outline">
              {copySuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden md:block">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span className="hidden md:block">Share Link</span>
                </>
              )}
            </Button>

            <Link to={`/dashboard/events/${id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4" />
                <span className="hidden md:block">Edit Event</span>
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {event.status === "active" && (
                  <DropdownMenuItem
                    onClick={() => handleToggleStatus("closed")}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tutup Pendaftaran
                  </DropdownMenuItem>
                )}
                {event.status === "closed" && (
                  <DropdownMenuItem
                    onClick={() => handleToggleStatus("active")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Buka Pendaftaran
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleToggleStatus("cancelled")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Batalkan Event
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteEvent}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Event Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Tanggal</p>
                <p className="font-medium">
                  {format(new Date(event.date), "PPP", { locale: localeId })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Lokasi</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Kuota</p>
                <p className="font-medium">
                  {event.quota
                    ? `${registeredCount} / ${event.quota} peserta`
                    : `${registeredCount} peserta (unlimited)`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Copy className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Public Link</p>
                <Link
                  to={publicLink}
                  target="_blank"
                  className="font-medium text-blue-600 truncate text-sm"
                >
                  {publicLink}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {event.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Deskripsi</p>
            <p className="text-gray-900 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total Pendaftar</p>
          <p className="text-3xl font-bold text-gray-900">{registeredCount}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Sudah Hadir</p>
          <p className="text-3xl font-bold text-green-600">{attendedCount}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
          <p className="text-3xl font-bold text-blue-600">
            {registeredCount > 0
              ? Math.round((attendedCount / registeredCount) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Check-in Status Message */}
      {checkInStatus && (
        <div
          className={`mb-6 rounded-lg border p-4 ${
            checkInStatus.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <p className="font-medium">{checkInStatus.message}</p>
        </div>
      )}

      {/* Check-in Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Check-In Peserta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={() => setShowScanner(true)} className="w-full">
            <QrCode className="h-4 w-4" />
            Scan QR Code
          </Button>
          <Button
            onClick={() => setShowManualCheckIn(true)}
            variant="outline"
            className="w-full"
          >
            <Keyboard className="h-4 w-4" />
            Manual Check-In
          </Button>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Daftar Peserta ({registeredCount})
          </h2>
          {participants.length > 0 && (
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>

        {participants.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Belum ada peserta yang daftar</p>
            <p className="text-sm text-gray-500">
              Share link event ini buat mulai terima pendaftar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {participant.name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {participant.email || "-"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {participant.phone || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {participant.ticket_id}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          participant.attendance_status === "present"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {participant.attendance_status === "present"
                          ? "Hadir"
                          : "Belum Hadir"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(
                        new Date(participant.created_at as string),
                        "PPp",
                        {
                          locale: localeId,
                        }
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showScanner && (
        <QRScanner
          onScan={handleCheckIn}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showManualCheckIn && (
        <ManualCheckIn
          onSubmit={handleCheckIn}
          onClose={() => setShowManualCheckIn(false)}
        />
      )}
    </div>
  );
}
