**Task: CRUD Event (Sprint 2)**

Konteks:
- Next.js 16 App Router + TypeScript
- Schema ada di `src/db/schema.ts` — gunakan tabel `events` dan `ticketTypes` yang sudah ada
- Auth helper `getSession()` dan `requireRole()` sudah tersedia dari Sprint 1
- Semua mutasi event menggunakan **Server Actions**
- Konvensi lengkap ada di `CONVENTIONS.md`

**Yang harus dikerjakan:**

**1. Server Actions** (`src/actions/events.ts`)
- `createEvent(data)` — buat event baru, status awal selalu `"draft"`, validasi `endAt` harus setelah `startAt`, wajib ada minimal 1 item di `ticketTypes`
- `updateEvent(id, data)` — update event, validasi hanya pemilik event yang bisa edit, validasi transisi status (tidak bisa dari `completed` kembali ke `published`)
- `deleteEvent(id)` — hanya bisa hapus jika status `"draft"` dan `soldCount` semua ticketTypes = 0

**2. Server Actions** (`src/actions/ticket-types.ts`)
- `addTicketType(eventId, data)` — tambah tipe tiket ke event
- `updateTicketType(id, data)` — harga dan quota tidak bisa diubah jika sudah ada `soldCount > 0`
- `deleteTicketType(id)` — hanya bisa hapus jika `soldCount === 0`

**3. Route Handlers** (khusus dua endpoint ini karena dipanggil client atau butuh response spesifik)
- `GET /api/v1/events` — listing event publik dengan filter `status = "published"`, support query params: `page`, `limit`, `search`, `category`, `locationType`, `type` (free/paid), `dateFrom`, `dateTo`, `sort`. Set header `Cache-Control: s-maxage=60, stale-while-revalidate` untuk ISR
- `GET /api/v1/events/[id]` — detail satu event beserta `ticketTypes`, hanya return event dengan status `"published"`. Set header ISR yang sama

**4. Queries** (`src/db/queries/events.ts`)
Pisahkan query logic dari action logic:
- `getPublishedEvents(filters)` — untuk listing publik
- `getEventById(id)` — untuk detail, include relasi `organizer` dan `ticketTypes`
- `getOrganizerEvents(organizerId, filters)` — untuk dashboard organizer, include semua status
- `getEventWithOwnerCheck(id, organizerId)` — untuk validasi kepemilikan sebelum mutasi

**Catatan penting untuk agent:**
- Semua harga dalam integer Rupiah, jangan konversi ke float
- `capacity` bisa `null` artinya unlimited — handle kasus ini di validasi registrasi nanti
- `posterUrl` diterima sebagai string URL — upload ke Cloudinary dilakukan terpisah di client, bukan di action ini
- Gunakan types yang sudah ada di `schema.ts`, jangan redefinisi manual
- Jangan buat UI dulu

---

**Task: Buat Bruno Collection untuk testing Sprint 2**

Buat Bruno collection di folder `/bruno` di root project. Struktur:

```
/bruno
  /events
    get-events.bru          → GET /api/v1/events
    get-events-filtered.bru → GET /api/v1/events?category=workshop&type=free
    get-event-detail.bru    → GET /api/v1/events/[id]
  /organizer
    create-event.bru        → invoke createEvent server action via test route
    update-event.bru
    delete-event.bru
    add-ticket-type.bru
    update-ticket-type.bru
    delete-ticket-type.bru
environments/
  local.bru                 → base url http://localhost:3000
```

Untuk server actions yang tidak punya route handler publik, buat **temporary test route** di `GET /api/test/events/[action]` yang invoke action langsung dengan hardcoded payload — sama seperti pola test di Sprint 1. Hapus setelah testing selesai.

Sertakan contoh payload yang realistis — gunakan data event dummy yang masuk akal (bukan "test123").

---

Setelah collection siap, urutan testing yang gue sarankan:

**Pertama — happy path:**
1. Create event → catat UUID yang dikembalikan
2. Get event detail dengan UUID itu → harusnya 404 karena masih draft
3. Update event status ke `published`
4. Get event detail lagi → sekarang harusnya return data
5. Get listing events → event muncul di list
6. Add ticket type ke event itu
7. Update ticket type
8. Delete event → harusnya gagal karena sudah published

**Kedua — edge cases:**
- Create event dengan `endAt` sebelum `startAt` → harusnya error
- Create event tanpa `ticketTypes` → harusnya error
- Update event milik organizer lain → harusnya `403`
- Delete ticket type yang sudah ada `soldCount > 0` → harusnya error
