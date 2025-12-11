/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { nanoid } from "nanoid";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import supabase from "@/utils/supabase";
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
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

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
});

type EventFormData = z.infer<typeof eventSchema>;

export default function CreateEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      quota: undefined,
      time: "09:00",
    },
  });

  const selectedDate = watch("date");

  const generateSlug = (title: string): string => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);

    const uniqueId = nanoid(6);
    return `${baseSlug}-${uniqueId}`;
  };

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const slug = generateSlug(data.title);

      const { data: eventData, error: insertError } = await supabase
        .from("events")
        .insert({
          user_id: user.id,
          title: data.title,
          slug: slug,
          description: data.description || null,
          location: data.location,
          date: data.date.toISOString(),
          quota: data.quota || null,
          status: "active",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-events"] });

      navigate(`/dashboard/events/${eventData.id}`);
    } catch (err: any) {
      setError(err.message || "Gagal membuat event");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard/events")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Buat Event Baru</h1>
        <p className="text-gray-600 mt-2">
          Isi detail event yang mau kamu bikin
        </p>
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
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "Menyimpan..." : "Buat Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard/events")}
            disabled={isLoading}
          >
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}
