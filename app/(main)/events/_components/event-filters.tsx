"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { eventCategoryEnum } from "@/src/db/schema";

const categories = ["all", ...eventCategoryEnum.enumValues];

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);

  const currentCategory = searchParams.get("category") || "all";
  const currentType = searchParams.get("type") || "all";
  const currentLocation = searchParams.get("locationType") || "all";

  // Sync search state with URL (e.g. back button)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== search) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(urlSearch);
    }
  }, [searchParams, search]);

  // Update URL when debounced search changes
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    
    // Only update if search value actually changed
    if (debouncedSearch === currentSearch) return;

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // Reset to page 1 on search
    router.push(`/events?${params.toString()}`);
  }, [debouncedSearch, router, searchParams]);

  const updateFilter = (key: string, value: string) => {
    const currentValue = searchParams.get(key) || "all";
    if (value === currentValue) return;

    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.push(`/events?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari event..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Kategori</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={currentCategory === cat ? "default" : "outline"}
              className="cursor-pointer capitalize px-3 py-1"
              onClick={() => updateFilter("category", cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Type Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Tipe Tiket</h3>
        <div className="flex gap-2">
          {["all", "free", "paid"].map((type) => (
            <Badge
              key={type}
              variant={currentType === type ? "default" : "outline"}
              className="cursor-pointer capitalize px-3 py-1"
              onClick={() => updateFilter("type", type)}
            >
              {type === "all" ? "Semua" : type === "free" ? "Gratis" : "Berbayar"}
            </Badge>
          ))}
        </div>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Lokasi</h3>
        <div className="flex gap-2">
          {["all", "offline", "online"].map((loc) => (
            <Badge
              key={loc}
              variant={currentLocation === loc ? "default" : "outline"}
              className="cursor-pointer capitalize px-3 py-1"
              onClick={() => updateFilter("locationType", loc)}
            >
              {loc === "all" ? "Semua" : loc}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
