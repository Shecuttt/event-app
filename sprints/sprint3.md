**Task: Flow Registrasi Event (Sprint 3)**

Konteks:
- Schema ada di `src/db/schema.ts`
- Auth helper `getSession()` dan `requireRole()` sudah tersedia
- Koneksi DB sudah pakai `@neondatabase/serverless` dengan WebSocket — gunakan `db.transaction()` untuk operasi yang butuh atomicity
- Konvensi ada di `CONVENTIONS.md`

**Yang harus dikerjakan:**

**1. Server Action** (`src/actions/registrations.ts`)

`registerEvent(eventId, ticketTypeId)`:
- Validasi user sudah login
- Validasi event exists, status `"published"`, dan belum melewati `endAt`
- Validasi user belum pernah registrasi event yang sama (cek tabel `registrations`)
- Validasi `ticketType` milik event tersebut
- Validasi kuota: `soldCount < quota`
- Validasi kapasitas event: jika `capacity` tidak null, total `registrations` di event itu belum melebihi `capacity`
- Jalankan dalam satu `db.transaction()`:
  - Insert row baru ke `registrations` dengan status `"registered"`
  - Increment `soldCount` di `ticketTypes`
  - Generate `qrCode` — format: `IVENTO-{registrationId}-{randomHash6char}`
  - Update `qrCode` di row registrasi yang baru dibuat
- Return data registrasi lengkap beserta `qrCode`

**2. Server Action** (`src/actions/check-in.ts`)

`checkInAttendee(qrCode)`:
- Validasi user adalah organizer
- Query registrasi berdasarkan `qrCode`
- Validasi registrasi ditemukan
- Validasi `eventId` dari registrasi adalah event milik organizer yang sedang login
- Validasi status belum `"checked_in"` — kalau sudah, return error `ALREADY_CHECKED_IN`
- Update status ke `"checked_in"` dan set `attendedAt` ke waktu sekarang
- Return data peserta: nama, email, nama tiket

**3. Route Handlers**

`GET /api/v1/registrations/my`:
- Auth required
- Return semua registrasi milik user yang login
- Include relasi: event (id, title, posterUrl, startAt, locationType, locationDetail), ticketType (name, price)
- Support query params: `page`, `limit`, `status`

`GET /api/v1/registrations/[id]`:
- Auth required
- Hanya bisa diakses oleh pemilik registrasi atau organizer event terkait
- Return detail lengkap registrasi

`GET /api/v1/organizer/events`:
- Auth required, role `organizer`
- Return semua event milik organizer yang login, semua status termasuk draft
- Support query params: `page`, `limit`, `status`

`GET /api/v1/events/[id]/attendees`:
- Auth required, role `organizer`, harus pemilik event
- Return daftar peserta event
- Support query params: `page`, `limit`, `status`
- Gunakan query yang sudah ada di `src/db/queries/events.ts` — tambahkan fungsi baru di sana kalau perlu, jangan tulis raw query di route handler

`GET /api/v1/events/[id]/attendees/export`:
- Auth required, role `organizer`, harus pemilik event
- Return CSV dengan kolom: `name`, `email`, `ticketType`, `status`, `registeredAt`, `attendedAt`
- Set header: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="attendees-{eventId}.csv"`

**4. Queries** (`src/db/queries/registrations.ts`)
- `getRegistrationByQrCode(qrCode)` — include relasi event dan user
- `getRegistrationsByUser(userId, filters)` — untuk endpoint `/my`
- `getRegistrationById(id)` — include semua relasi
- `getAttendeesByEvent(eventId, filters)` — untuk endpoint attendees

**Catatan penting:**
- `registerEvent` wajib pakai `db.transaction()` — ada dua tabel yang diupdate sekaligus (`registrations` dan `ticketTypes`)
- `qrCode` untuk event berbayar di-generate nanti di Sprint 4 setelah payment confirmed, bukan di sini — tapi `registerEvent` action ini hanya akan dipanggil untuk event gratis di Sprint 3. Tambahkan guard: kalau `ticketType.price > 0`, throw error `USE_PAYMENT_FLOW`
- Jangan buat UI dulu

---

**Task: Tambah Bruno Collection untuk Sprint 3**

Tambahkan folder baru di `/bruno`:

```
/bruno
  /registrations
    register-event-free.bru      → invoke registerEvent server action
    register-duplicate.bru       → registrasi event yang sama dua kali
    register-paid-event.bru      → registrasi event berbayar (harusnya error USE_PAYMENT_FLOW)
    get-my-registrations.bru     → GET /api/v1/registrations/my
    get-registration-detail.bru  → GET /api/v1/registrations/[id]
  /organizer
    get-organizer-events.bru     → GET /api/v1/organizer/events
    get-attendees.bru            → GET /api/v1/events/[id]/attendees
    export-attendees.bru         → GET /api/v1/events/[id]/attendees/export
    check-in.bru                 → invoke checkInAttendee server action
    check-in-duplicate.bru       → check-in peserta yang sudah checked in
```

Buat juga temporary test routes di `/api/test/` untuk invoke server actions `registerEvent` dan `checkInAttendee` dengan hardcoded payload realistis.

---

Urutan testing setelah collection siap:

**Setup data dulu:**
Pastikan di database ada satu event published dengan dua ticket type — satu gratis (`price: 0`), satu berbayar (`price: 150000`). Bisa pakai test route dari Sprint 2 atau insert manual via Drizzle Studio (`npx drizzle-kit studio`).

**Happy path:**
1. Register event gratis → catat `registrationId` dan `qrCode`
2. Get `/registrations/my` → registrasi tadi muncul
3. Get `/registrations/[id]` → detail lengkap dengan relasi event dan ticketType
4. Get `/organizer/events` → event muncul dengan `registeredCount` sudah bertambah
5. Get `/events/[id]/attendees` → peserta muncul dengan status `registered`
6. Check-in dengan `qrCode` yang didapat tadi → status berubah ke `checked_in`, `attendedAt` terisi
7. Get attendees lagi → status peserta sudah `checked_in`
8. Export attendees → file CSV terdownload dengan data yang benar

**Edge cases:**
- Register event yang sama dua kali → error `ALREADY_REGISTERED`
- Register event berbayar → error `USE_PAYMENT_FLOW`
- Check-in dengan QR code yang sudah dipakai → error `ALREADY_CHECKED_IN`
- Check-in dengan QR code dari event milik organizer lain → error `403`
- Get `/registrations/[id]` milik user lain (bukan organizer event itu) → error `403`
- Register event yang sudah `completed` atau `cancelled` → error
- Register event dengan kuota habis — set quota ticket type ke angka kecil, isi dulu sampai penuh, lalu coba register lagi → error `TICKET_SOLD_OUT`
