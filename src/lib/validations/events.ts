import { z } from "zod";

export const ticketTypeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama tiket harus diisi"),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  quota: z.coerce.number().min(1, "Kuota minimal 1"),
});

export const eventSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(100),
  description: z.string().min(20, "Deskripsi minimal 20 karakter"),
  category: z.enum(["music", "seminar", "sport", "workshop", "community", "other"]),
  locationType: z.enum(["offline", "online"]),
  locationDetail: z.string().min(5, "Detail lokasi minimal 5 karakter"),
  startAt: z.string().min(1, "Waktu mulai harus diisi"),
  endAt: z.string().min(1, "Waktu selesai harus diisi"),
  capacity: z.coerce.number().nullable().optional(),
  posterUrl: z.string().optional(),
  ticketTypes: z.array(ticketTypeSchema).min(1, "Minimal harus ada 1 tipe tiket"),
}).refine((data) => {
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  return end > start;
}, {
  message: "Waktu selesai harus setelah waktu mulai",
  path: ["endAt"],
});

export type EventInput = z.infer<typeof eventSchema>;
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;
