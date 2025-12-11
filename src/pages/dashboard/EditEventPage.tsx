/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database.types";
import supabase from "@/utils/supabase";

type Event = Tables<"events">;

const eventSchema = z.object({
  title: z
    .string()
    .min(3, "Judul minimal 3 karakter")
    .max(100, "Judul maksimal 100 karakter"),
  description: z.string().optional(),
  location: z.string().min(3, "Lokasi minimal 3 karakter"),
  date: z.date({ error: "Tanggal wajib diisi" }),
  time: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Format waktu tidak valid (HH:MM)"
    ),
  quota: z
    .number()
    .int()
    .positive()
    .optional()
    .or(z.nan().transform(() => undefined)),
  status: z.enum(["active", "closed", "cancelled"]),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    values: event
      ? {
          title: event.title,
          description: event.description || "",
          location: event.location || "",
          date: new Date(event.date),
          time: format(new Date(event.date), "HH:mm"),
          quota: event.quota || undefined,
          status: event.status as "active" | "closed" | "cancelled",
        }
      : undefined,
  });

  const selectedDate = watch("date");
  const selectedStatus = watch("status");

  const onSubmit = async (data: EventFormData) => {
    if (!event) return;

    setIsLoading(true);
    setError(null);

    try {
      // Combine date and time
      const [hours, minutes] = data.time.split(":").map(Number);
      const eventDateTime = new Date(data.date);
      eventDateTime.setHours(hours, minutes, 0, 0);

      const { error: updateError } = await supabase
        .from("events")
        .update({
          title: data.title,
          description: data.description || null,
          location: data.location,
          date: eventDateTime.toISOString(),
          quota: data.quota || null,
          status: data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id as string);

      if (updateError) throw updateError;

      // Invalidate queries buat force refetch
      await queryClient.invalidateQueries({ queryKey: ["event", id] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });

      navigate(`/dashboard/events/${id}`);
    } catch (err: any) {
      setError(err.message || "Gagal update event");
      setIsLoading(false);
    }
  };

  if (eventLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading event...</p>
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

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/dashboard/events/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-600 mt-2">Update detail event lo</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Nama Event <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register("title")}
              id="title"
              placeholder="Workshop Web Development"
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              {...register("description")}
              id="description"
              placeholder="Jelaskan event kamu secara singkat..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">Opsional - bisa dikosongin</p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Lokasi <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register("location")}
              id="location"
              placeholder="Gedung A Lt. 3, Kampus ITB"
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>
              Tanggal Event <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: localeId })
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setValue("date", date as Date)}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  autoFocus
                  locale={localeId}
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">
              Waktu Event <span className="text-red-500">*</span>
            </Label>
            <Input
              {...register("time")}
              id="time"
              type="time"
              className={errors.time ? "border-red-500" : ""}
            />
            {errors.time && (
              <p className="text-sm text-red-600">{errors.time.message}</p>
            )}
            <p className="text-xs text-gray-500">Format: HH:MM (24 jam)</p>
          </div>

          {/* Quota */}
          <div className="space-y-2">
            <Label htmlFor="quota">Kuota Peserta</Label>
            <Input
              {...register("quota", {
                valueAsNumber: true,
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
              id="quota"
              type="number"
              min="0"
              placeholder="100"
            />
            <p className="text-xs text-gray-500">
              Opsional - kosongin kalo unlimited
            </p>
            {errors.quota && (
              <p className="text-sm text-red-600">{errors.quota.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status Event <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                setValue("status", value as "active" | "closed" | "cancelled")
              }
            >
              <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Aktif - Pendaftaran dibuka</span>
                  </div>
                </SelectItem>
                <SelectItem value="closed">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <span>Ditutup - Pendaftaran ditutup</span>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Dibatalkan - Event dibatalkan</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          {/* Warning box untuk perubahan status */}
          {selectedStatus !== event.status && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Perhatian:</strong>{" "}
                {selectedStatus === "closed" &&
                  'Peserta tidak akan bisa mendaftar lagi setelah status diubah ke "Ditutup".'}
                {selectedStatus === "cancelled" &&
                  'Event akan dibatalkan dan peserta yang sudah mendaftar akan melihat status event sebagai "Dibatalkan".'}
                {selectedStatus === "active" &&
                  "Pendaftaran akan dibuka kembali dan peserta bisa mendaftar."}
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Info:</strong> Slug event tidak bisa diubah. Public link
            akan tetap sama:{" "}
            <code className="bg-blue-100 px-2 py-1 rounded text-xs">
              /e/{event.slug}
            </code>
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/dashboard/events/${id}`)}
            disabled={isLoading}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
