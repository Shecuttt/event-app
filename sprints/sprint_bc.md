**Task: Breaking Changes — Hapus Role System, Implementasi Ownership-based Permission**

Ini adalah sprint refactor. Jangan tambah fitur baru. Fokus pada perubahan yang disebutkan di bawah secara berurutan.

**1. Update Schema** (`src/db/schema.ts`)

- Hapus `roleEnum` sepenuhnya
- Hapus kolom `role` dari tabel `users`
- Tambah kolom baru:
```ts
isOrganizer: boolean("is_organizer").notNull().default(false),
```
- Generate migration baru: `npx drizzle-kit generate`
- Review SQL migration yang digenerate sebelum dijalankan — pastikan tidak ada data loss yang tidak disengaja
- Jalankan migration: `npx drizzle-kit migrate`

**2. Update Types** (`src/db/schema.ts`)

Tipe `User` akan otomatis terupdate karena di-infer dari schema. Tidak perlu ubah manual — tapi pastikan tidak ada tempat di codebase yang masih reference `user.role`.

Cari semua reference berikut dan catat lokasinya sebelum mulai ubah:
```
user.role
session.user.role
roleEnum
requireRole
"organizer"
"participant"
```

**3. Hapus `requireRole` helper**

Di file auth helper (`src/lib/auth.ts` atau wherever helper ini berada):
- Hapus fungsi `requireRole()`
- Ganti dengan dua helper baru:

```ts
// Pastikan user sudah login, return session atau throw 401
export async function requireAuth(): Promise<Session>

// Pastikan user adalah pemilik event, return event atau throw 403
export async function requireEventOwner(eventId: string, userId: string): Promise<Event>
```

`requireEventOwner`:
- Query event berdasarkan `eventId`
- Kalau event tidak ditemukan → throw `404`
- Kalau `event.organizerId !== userId` → throw `403`
- Return event

**4. Update Middleware** (`middleware.ts`)

Hapus semua role-based logic. Middleware sekarang hanya melakukan satu hal:

```
Ada session? → lanjut
Tidak ada session + akses protected route? → redirect /login
```

Protected routes: semua `/dashboard/*` dan semua `/api/v1/*` kecuali:
- `GET /api/v1/events`
- `GET /api/v1/events/[id]`
- `POST /api/v1/transactions/webhook`

**5. Update Server Actions**

`src/actions/events.ts`:
- Hapus `requireRole("organizer")` di semua actions
- Ganti dengan `requireAuth()` untuk pastikan user login
- Ganti permission check dengan `requireEventOwner(eventId, session.user.id)`
- `createEvent` — tidak perlu cek role, semua user yang login boleh buat event
- `updateEvent` — pakai `requireEventOwner`
- `deleteEvent` — pakai `requireEventOwner`

`src/actions/ticket-types.ts`:
- Sama — hapus role check, ganti dengan `requireEventOwner`

`src/actions/registrations.ts`:
- Hapus semua reference ke role
- `registerEvent` — hanya perlu `requireAuth()`
- `checkInAttendee` — ganti role check dengan ownership check: query event dari registrasi, pastikan `event.organizerId === session.user.id`

`src/actions/auth.ts`:
- Hapus role dari `registerUser` — tidak ada role selection saat register
- User baru selalu `isOrganizer: false` by default

**6. Update `isOrganizer` flag**

Di `src/actions/events.ts`, fungsi `updateEvent`:
- Tambahkan trigger: kalau status diupdate ke `"published"` dan `user.isOrganizer === false`, set `isOrganizer: true` di tabel `users`
- Lakukan dalam satu `db.transaction()` bersama update event

**7. Update Route Handlers**

Semua route handler yang sebelumnya pakai `requireRole("organizer")`:
- `GET /api/v1/events/[id]/attendees` → ganti dengan `requireEventOwner`
- `GET /api/v1/events/[id]/attendees/export` → ganti dengan `requireEventOwner`
- `GET /api/v1/organizer/events` → ganti dengan `requireAuth()` saja, filter by `organizerId: session.user.id`
- `GET /api/v1/organizer/events/[id]/analytics` → ganti dengan `requireEventOwner`

**8. Update Auth.js Session**

Di konfigurasi Auth.js, update session callback:
- Hapus `role` dari session
- Tambah `isOrganizer` ke session

```ts
callbacks: {
  session({ session, user }) {
    session.user.id = user.id;
    session.user.isOrganizer = user.isOrganizer;
    return session;
  }
}
```

**9. Update Register Page**

Di `src/app/(auth)/register/_components/register-form.tsx`:
- Hapus field role selection (radio/select Participant vs Organizer)
- Form sekarang hanya: `name`, `email`, `password`

**Verifikasi setelah selesai:**

Jalankan pencarian global untuk memastikan tidak ada sisa reference:
```
grep -r "role" src/ --include="*.ts" --include="*.tsx"
grep -r "requireRole" src/ --include="*.ts" --include="*.tsx"
grep -r "roleEnum" src/ --include="*.ts" --include="*.tsx"
```

Hasil yang boleh muncul hanya dari komentar atau nama file yang tidak relevan. Kalau masih ada di logic code, fix dulu sebelum lanjut.

---

Setelah agent selesai, sebelum testing ada satu hal yang perlu lo lakukan manual: **hapus semua data di database** via Drizzle Studio atau query langsung — karena migration hapus kolom `role` bisa konflik dengan data lama.

```sql
TRUNCATE users, events, ticket_types, registrations, transactions CASCADE;
```

Ini aman dilakukan sekarang karena masih fase development, belum ada data production.

Verifikasi dulu sebelum lanjut ke Sprint UI.

**Task: Verifikasi Breaking Changes**

Jalankan tiga hal berikut dan laporkan hasilnya:

**1. Global search sisa reference role**
```bash
grep -r "role" src/ --include="*.ts" --include="*.tsx" -n
grep -r "requireRole" src/ --include="*.ts" --include="*.tsx" -n
grep -r "roleEnum" src/ --include="*.ts" --include="*.tsx" -n
```

**2. TypeScript compile check**
```bash
npx tsc --noEmit
```
Tidak boleh ada error. Kalau ada, fix dulu sebelum lanjut.

**3. Test manual via Bruno**

Jalankan ulang collection dari Sprint sebelumnya yang masih relevan:

- `create-event.bru` → harusnya berhasil tanpa perlu role
- `get-events.bru` → harusnya return list event published
- `register-event-free.bru` → harusnya berhasil
- `check-in.bru` → harusnya berhasil dengan ownership check
- `initiate-payment.bru` → harusnya berhasil

Satu skenario baru yang perlu ditambahkan ke Bruno:
- Coba edit event milik user lain → harusnya `403`
- Coba check-in event milik user lain → harusnya `403`

