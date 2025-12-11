/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/types/database.types";
import supabase from "@/utils/supabase";

type Event = Tables<"events"> & {
  participant_count?: number;
};

export default function DashboardHome() {
  // Fetch all events with participant count
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["dashboard-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, participants(count)")
        .order("date", { ascending: true });

      if (error) throw error;

      return (data || []).map((event: any) => ({
        ...event,
        participant_count: event.participants[0]?.count || 0,
      })) as Event[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  const now = new Date();
  const next7Days = addDays(now, 7);

  // Calculate stats
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === "active").length;
  const totalParticipants = events.reduce(
    (sum, e) => sum + (e.participant_count || 0),
    0
  );

  const upcomingEvents = events.filter(
    (e) => isAfter(new Date(e.date), now) && e.status !== "cancelled"
  );

  const thisWeekEvents = upcomingEvents.filter((e) =>
    isBefore(new Date(e.date), next7Days)
  );

  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.created_at || "").getTime() -
        new Date(a.created_at || "").getTime()
    )
    .slice(0, 5);

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          label="Total Events"
          value={totalEvents}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Event Aktif"
          value={activeEvents}
          color="green"
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Total Peserta"
          value={totalParticipants}
          color="purple"
        />
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          label="Event Minggu Ini"
          value={thisWeekEvents.length}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-linear-to-r from-blue-500 to-blue-600 rounded-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Siap bikin event baru?</h2>
            <p className="text-blue-100 line-clamp-2 text-xs md:text-sm lg:text-base">
              Buat event dalam hitungan menit dan langsung share ke audiens
            </p>
          </div>
          <Link to="/dashboard/events/new">
            <Button size="lg" variant="secondary">
              <Plus className="h-5 w-5" />
              Buat Event
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
            <Link to="/dashboard/events">
              <Button variant="ghost" size="sm">
                Lihat Semua
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">Belum ada upcoming event</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.slice(0, 5).map((event) => (
                <Link
                  key={event.id}
                  to={`/dashboard/events/${event.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1">
                      {event.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {event.status === "active" ? "Aktif" : "Ditutup"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(event.date), "EEE, d MMM yyyy", {
                          locale: localeId,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>
                        {event.participant_count} peserta
                        {event.quota && ` / ${event.quota}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Event Terbaru</h2>
          </div>

          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                Belum ada event yang dibuat
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/dashboard/events/${event.id}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1 truncate">
                      {event.title}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(event.date), "d MMM yyyy", {
                          locale: localeId,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Dibuat{" "}
                      {format(new Date(event.created_at || ""), "PPp", {
                        locale: localeId,
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* This Week's Events Highlight */}
      {thisWeekEvents.length > 0 && (
        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                Kamu punya {thisWeekEvents.length} event minggu ini!
              </h3>
              <p className="text-sm text-orange-800">
                Jangan lupa persiapan dan cek daftar peserta sebelum hari H.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div
        className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
