/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Share2,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tables } from "@/types/database.types";
import supabase from "@/utils/supabase";

type Event = Tables<"events"> & {
  participant_count?: number;
};

type FilterStatus = "all" | "active" | "closed" | "cancelled";

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  // Fetch events with participant count
  const {
    data: events = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["events", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*, participants(count)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include participant count
      return (data || []).map((event: any) => ({
        ...event,
        participant_count: event.participants[0]?.count || 0,
      })) as Event[];
    },
  });

  const handleCopyLink = (slug: string) => {
    const link = `${window.location.origin}/e/${slug}`;
    navigator.clipboard.writeText(link);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Yakin mau hapus event ini? Data ga bisa dikembalikan."))
      return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (!error) {
      refetch();
    }
  };

  // Filter events by search query
  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = filteredEvents.filter(
    (event) => new Date(event.date) >= now
  );
  const pastEvents = filteredEvents.filter(
    (event) => new Date(event.date) < now
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Kelola semua event lo</p>
        </div>
        <Link to="/dashboard/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Buat Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as FilterStatus)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="closed">Ditutup</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty State */}
      {events.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum Ada Event
          </h3>
          <p className="text-gray-600 mb-6">
            Mulai bikin event pertamamu sekarang
          </p>
          <Link to="/dashboard/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Buat Event Pertama
            </Button>
          </Link>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ga Ada Event
          </h3>
          <p className="text-gray-600">
            Coba ubah filter atau keyword pencarian lo
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Upcoming Events ({upcomingEvents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onCopyLink={handleCopyLink}
                    onDelete={handleDeleteEvent}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Past Events ({pastEvents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onCopyLink={handleCopyLink}
                    onDelete={handleDeleteEvent}
                    isPast
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Event Card Component
function EventCard({
  event,
  onCopyLink,
  onDelete,
  isPast = false,
}: {
  event: Event;
  onCopyLink: (slug: string) => void;
  onDelete: (id: string) => void;
  isPast?: boolean;
}) {
  const quotaPercentage = event.quota
    ? Math.round((event.participant_count! / event.quota) * 100)
    : 0;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${
        isPast ? "opacity-75" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Link to={`/dashboard/events/${event.id}`}>
            <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
              {event.title}
            </h3>
          </Link>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                to={`/dashboard/events/${event.id}`}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                to={`/dashboard/events/${event.id}/edit`}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCopyLink(event.slug)}>
              <Share2 className="mr-2 h-4 w-4" />
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(event.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Event
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>
            {format(new Date(event.date), "EEE, d MMM yyyy - HH:mm", {
              locale: localeId,
            })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className="truncate">{event.location}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4 text-gray-400" />
          <span>
            {event.participant_count} peserta
            {event.quota && ` / ${event.quota}`}
          </span>
        </div>
      </div>

      {/* Quota Progress Bar */}
      {event.quota && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Kuota</span>
            <span>{quotaPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                quotaPercentage >= 100
                  ? "bg-red-500"
                  : quotaPercentage >= 80
                  ? "bg-yellow-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
