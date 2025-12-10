/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { nanoid } from "nanoid";
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database.types";
import supabase from "@/utils/supabase";
import { QRCodeSVG } from "qrcode.react";

type Event = Tables<"events">;

const registrationSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.email("Email tidak valid").optional().or(z.literal("")),
  phone: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .optional()
    .or(z.literal("")),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function PublicEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  // Fetch event details
  const { data: event, isLoading } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug as string)
        .single();

      if (error) throw error;
      return data as Event;
    },
    retry: false,
  });

  // Fetch participant count
  const { data: participantCount = 0 } = useQuery({
    queryKey: ["participant-count", event?.id],
    queryFn: async () => {
      if (!event?.id) return 0;

      const { count, error } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!event?.id,
  });

  const onSubmit = async (data: RegistrationFormData) => {
    if (!event) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if quota is full
      if (event.quota && participantCount >= event.quota) {
        throw new Error("Kuota event sudah penuh");
      }

      // Generate unique ticket ID
      const newTicketId = `TIX-${nanoid(8).toUpperCase()}`;

      // Insert participant
      const { error: insertError } = await supabase
        .from("participants")
        .insert({
          event_id: event.id,
          ticket_id: newTicketId,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          attendance_status: "registered",
        });

      if (insertError) throw insertError;

      // Invalidate queries buat update participant count
      await queryClient.invalidateQueries({
        queryKey: ["participant-count", event.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["participants", event.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["event", event.id] });

      setTicketId(newTicketId);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar. Coba lagi.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Event Tidak Ditemukan
        </h2>
        <p className="text-gray-600">
          Link yang lo akses tidak valid atau event sudah dihapus.
        </p>
      </div>
    );
  }

  // Check if event is closed or cancelled
  const isClosed = event.status === "closed" || event.status === "cancelled";
  const isQuotaFull = event.quota ? participantCount >= event.quota : false;
  const canRegister = !isClosed && !isQuotaFull;

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registrasi Berhasil!
          </h2>
          <p className="text-gray-600 mb-6">Lo udah terdaftar di event ini.</p>

          {/* QR Code */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6 inline-block">
            <QRCodeSVG value={ticketId} size={200} level="H" marginSize={2} />
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Ticket ID lo</p>
            <code className="text-2xl font-mono font-bold text-blue-600">
              {ticketId}
            </code>
            <p className="text-sm text-gray-500 mt-4">
              Screenshot QR code atau simpan ticket ID ini. Lo bakal butuh ini
              pas hari H buat check-in.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>📧 Cek email lo</strong> buat konfirmasi dan detail
              lengkap event.
              <br />
              Ga dapet email? Cek folder spam.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Event Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
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
              ? "Pendaftaran Dibuka"
              : event.status === "closed"
              ? "Pendaftaran Ditutup"
              : "Event Dibatalkan"}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span>
              {format(new Date(event.date), "EEEE, d MMMM yyyy", {
                locale: localeId,
              })}
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Clock className="h-5 w-5 text-gray-400" />
            <span>
              {format(new Date(event.date), "HH:mm", { locale: localeId })} WIB
            </span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <MapPin className="h-5 w-5 text-gray-400" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-700">
            <Users className="h-5 w-5 text-gray-400" />
            <span>
              {event.quota
                ? `${participantCount} / ${event.quota} peserta terdaftar`
                : `${participantCount} peserta terdaftar`}
            </span>
          </div>
        </div>

        {event.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Tentang Event</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}
      </div>

      {/* Registration Form or Closed Message */}
      {!canRegister ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                {isQuotaFull ? "Kuota Penuh" : "Pendaftaran Ditutup"}
              </h3>
              <p className="text-sm text-yellow-800">
                {isQuotaFull
                  ? "Maaf, kuota peserta event ini sudah penuh."
                  : event.status === "cancelled"
                  ? "Event ini telah dibatalkan oleh penyelenggara."
                  : "Pendaftaran untuk event ini sudah ditutup."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Daftar Sekarang
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("name")}
                id="name"
                placeholder="John Doe"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="john@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Opsional - buat nerima konfirmasi via email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP</Label>
              <Input
                {...register("phone")}
                id="phone"
                type="tel"
                placeholder="08123456789"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Opsional - buat dihubungi panitia
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Mendaftar..." : "Daftar Event"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
