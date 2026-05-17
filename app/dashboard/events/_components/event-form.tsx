"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldLabel, FieldError, FieldContent } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  eventSchema,
  type EventInput,
} from "@/src/lib/validations/events";
import { createEvent, updateEvent } from "@/src/actions/events";
import { type EventWithRelations } from "@/src/db/queries/events";

interface EventFormProps {
  initialData?: Omit<EventWithRelations, 'organizer'> & { organizer?: EventWithRelations['organizer'] };
  isEditing?: boolean;
}

export function EventForm({ initialData, isEditing = false }: EventFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      description: initialData.description,
      category: initialData.category,
      locationType: initialData.locationType,
      locationDetail: initialData.locationDetail,
      startAt: initialData.startAt ? new Date(initialData.startAt).toISOString().slice(0, 16) : "",
      endAt: initialData.endAt ? new Date(initialData.endAt).toISOString().slice(0, 16) : "",
      capacity: initialData.capacity,
      posterUrl: initialData.posterUrl || "",
      ticketTypes: initialData.ticketTypes.map(tt => ({
        id: tt.id,
        name: tt.name,
        price: tt.price,
        quota: tt.quota,
      })),
    } : {
      title: "",
      description: "",
      category: "other",
      locationType: "offline",
      locationDetail: "",
      startAt: "",
      endAt: "",
      capacity: null,
      posterUrl: "",
      ticketTypes: [{ name: "Reguler", price: 0, quota: 100 }],
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const locationType = useWatch({
    control,
    name: "locationType",
  });

  const posterUrl = useWatch({
    control,
    name: "posterUrl",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const signatureRes = await fetch('/api/v1/upload/signature', { method: 'POST' });
      if (!signatureRes.ok) throw new Error("Failed to get signature");
      
      const { signature, timestamp, cloudName, apiKey, folder } = await signatureRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        setValue("posterUrl", data.secure_url);
        toast.success("Poster berhasil diunggah");
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunggah poster");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: EventInput) => {
    try {
      if (isEditing && initialData) {
        const result = await updateEvent(initialData.id, data);
        if (result && "error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Event berhasil diperbarui");
      } else {
        const result = await createEvent(data);
        if (result && "error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Event berhasil dibuat");
        if (result && "eventId" in result) {
          router.push(`/dashboard/events/${result.eventId}/edit`);
        }
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan event";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={control}
                name="title"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Judul Event</FieldLabel>
                    <FieldContent>
                      <Input placeholder="Contoh: Konser Amal 2024" {...field} />
                    </FieldContent>
                    <FieldError errors={[{ message: errors.title?.message }]} />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Kategori</FieldLabel>
                    <FieldContent>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="music">Musik</SelectItem>
                          <SelectItem value="seminar">Seminar</SelectItem>
                          <SelectItem value="sport">Olahraga</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="community">Komunitas</SelectItem>
                          <SelectItem value="other">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldContent>
                    <FieldError errors={[{ message: errors.category?.message }]} />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Deskripsi</FieldLabel>
                    <FieldContent>
                      <Textarea
                        placeholder="Jelaskan detail event Anda..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FieldContent>
                    <FieldError errors={[{ message: errors.description?.message }]} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waktu & Lokasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="startAt"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Waktu Mulai</FieldLabel>
                      <FieldContent>
                        <Input type="datetime-local" {...field} />
                      </FieldContent>
                      <FieldError errors={[{ message: errors.startAt?.message }]} />
                    </Field>
                  )}
                />
                <Controller
                  control={control}
                  name="endAt"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Waktu Selesai</FieldLabel>
                      <FieldContent>
                        <Input type="datetime-local" {...field} />
                      </FieldContent>
                      <FieldError errors={[{ message: errors.endAt?.message }]} />
                    </Field>
                  )}
                />
              </div>

              <Controller
                control={control}
                name="locationType"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Tipe Lokasi</FieldLabel>
                    <FieldContent>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="offline">Offline (Tatap Muka)</SelectItem>
                          <SelectItem value="online">Online (Streaming)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldContent>
                    <FieldError errors={[{ message: errors.locationType?.message }]} />
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="locationDetail"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Detail Lokasi</FieldLabel>
                    <FieldContent>
                      <Input
                        placeholder={
                          locationType === "offline"
                            ? "Alamat lengkap atau nama tempat"
                            : "Link Zoom/Google Meet atau platform lainnya"
                        }
                        {...field}
                      />
                    </FieldContent>
                    <FieldError errors={[{ message: errors.locationDetail?.message }]} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tipe Tiket</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", price: 0, quota: 10 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Tiket
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg relative group">
                  <div className="md:col-span-2">
                    <Controller
                      control={control}
                      name={`ticketTypes.${index}.name`}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-xs">Nama Tiket</FieldLabel>
                          <FieldContent>
                            <Input placeholder="Reguler, VIP, dll" {...field} />
                          </FieldContent>
                          <FieldError errors={[{ message: errors.ticketTypes?.[index]?.name?.message }]} />
                        </Field>
                      )}
                    />
                  </div>
                  <div>
                    <Controller
                      control={control}
                      name={`ticketTypes.${index}.price`}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-xs">Harga (Rp)</FieldLabel>
                          <FieldContent>
                            <Input type="number" {...field} />
                          </FieldContent>
                          <FieldError errors={[{ message: errors.ticketTypes?.[index]?.price?.message }]} />
                        </Field>
                      )}
                    />
                  </div>
                  <div>
                    <Controller
                      control={control}
                      name={`ticketTypes.${index}.quota`}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel className="text-xs">Kuota</FieldLabel>
                          <FieldContent>
                            <Input type="number" {...field} />
                          </FieldContent>
                          <FieldError errors={[{ message: errors.ticketTypes?.[index]?.quota?.message }]} />
                        </Field>
                      )}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 bg-background border rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <FieldError errors={[{ message: errors.ticketTypes?.root?.message || (errors.ticketTypes as { message?: string } | undefined)?.message }]} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Poster Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "relative aspect-[3/4] w-full overflow-hidden rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted transition-colors",
                  posterUrl ? "border-solid" : "hover:bg-muted/80"
                )}
              >
                {posterUrl ? (
                  <>
                    <Image
                      src={posterUrl}
                      alt="Poster Preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setValue("posterUrl", "")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Klik untuk unggah poster</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      accept="image/*"
                      onChange={handleUpload}
                      disabled={isUploading}
                    />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <p className="text-sm font-medium">Mengunggah...</p>
                  </div>
                )}
              </div>
              <FieldError errors={[{ message: errors.posterUrl?.message }]} />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting || isUploading}>
            {isSubmitting ? "Menyimpan..." : isEditing ? "Perbarui Event" : "Buat Event"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        </div>
      </div>
    </form>
  );
}

