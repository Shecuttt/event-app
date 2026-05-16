"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransition } from "react";

export function AttendeeFilter() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1");

    startTransition(() => {
      router.push(`/dashboard/events/${params.id}/attendees?${newParams.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Select
        defaultValue={searchParams.get("status") || "all"}
        onValueChange={(value) => updateFilter("status", value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filter Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="registered">Terdaftar</SelectItem>
          <SelectItem value="checked_in">Sudah Hadir</SelectItem>
          <SelectItem value="absent">Tidak Hadir</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
