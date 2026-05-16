**Task: Sprint UI — Dashboard Organizer**

Konteks:
- Styling: gunakan CSS variables dari `global.css` — tidak boleh ada hardcoded warna seperti `text-gray-500`, `bg-white`, `border-gray-200`, dll. Gunakan variabel shadcn yang sudah ada seperti `text-muted-foreground`, `bg-background`, `bg-card`, `border`, `text-foreground`, dll
- Konvensi server/client separation tetap berlaku — ikuti `CONVENTIONS.md`
- Semua data fetch di Server Component, interaktivitas di Client Component

---

**1. Layout Dashboard** (`app/dashboard/layout.tsx`)

Server Component. Cek session — kalau tidak ada, redirect ke `/login`.

Layout terdiri dari:
- Sidebar di desktop (collapsible di mobile jadi bottom nav atau hamburger)
- Menu sidebar:
  - Overview (hanya tampil kalau `session.user.isOrganizer === true`)
  - Event Saya (hanya tampil kalau `session.user.isOrganizer === true`)
  - Buat Event (selalu tampil)
  - Tiket Saya (selalu tampil)
  - Pengaturan (selalu tampil)
- `{children}` di area konten utama

Struktur file:
```
app/dashboard/
  layout.tsx                         → Server Component
  _components/
    sidebar.tsx                      → Client Component (state collapse)
    sidebar-nav.tsx                  → Server Component (terima isOrganizer sebagai prop)
```

---

**2. Halaman Overview** (`app/dashboard/page.tsx`)

Server Component. Hanya accessible kalau `isOrganizer === true` — kalau tidak, redirect ke `/dashboard/tickets`.

Tampilkan summary cards:
- Total event aktif (status `published`)
- Total event draft
- Total peserta di semua event milik user ini
- Total revenue (sum dari transaksi `paid` di semua event milik user ini)

Di bawah summary cards, tampilkan tabel event terbaru milik organizer — 5 event terbaru, kolom: judul, status, tanggal, peserta, aksi (edit, lihat peserta).

Struktur file:
```
app/dashboard/
  page.tsx                           → Server Component
  _components/
    summary-cards.tsx                → Server Component
    recent-events-table.tsx          → Server Component
```

---

**3. Halaman Event Saya** (`app/dashboard/events/page.tsx`)

Server Component untuk initial load, Client Component untuk filter.

Tampilkan semua event milik organizer yang login. Gunakan `GET /api/v1/organizer/events` route handler yang sudah ada.

Struktur file:
```
app/dashboard/events/
  page.tsx                           → Server Component, terima searchParams
  _components/
    events-table.tsx                 → Server Component
    events-filter.tsx                → Client Component (filter status)
```

`EventsTable`:
- Kolom: poster (thumbnail kecil), judul, status (badge), tanggal, peserta/kapasitas, aksi
- Aksi per row: Edit, Lihat Peserta, tombol ubah status (publish/cancel)
- Badge status pakai warna dari CSS variables — jangan hardcode warna badge

`EventsFilter` (Client Component):
- Filter by status: Semua, Draft, Published, Cancelled, Completed
- Update URL query params via `useRouter`

---

**4. Halaman Buat & Edit Event** (`app/dashboard/events/new/page.tsx` dan `app/dashboard/events/[id]/edit/page.tsx`)

Edit page fetch data event existing dulu, pass ke form sebagai `defaultValues`.

Struktur file:
```
app/dashboard/events/
  new/
    page.tsx                         → Server Component
  [id]/
    edit/
      page.tsx                       → Server Component (fetch event, validasi ownership)
  _components/
    event-form.tsx                   → Client Component ("use client")
```

`EventForm` (Client Component) — dipakai untuk create dan edit:
- Fields: judul, deskripsi (textarea), kategori (select), tipe lokasi (toggle: offline/online), detail lokasi, tanggal mulai, tanggal selesai, kapasitas (opsional), poster upload
- Untuk poster upload: upload langsung ke Cloudinary dari client via signed upload, simpan URL yang dikembalikan Cloudinary, kirim URL ke server action
- Ticket types section: bisa tambah/hapus ticket type dinamis (array fields dengan `react-hook-form` `useFieldArray`), setiap item: nama, harga (0 untuk gratis), kuota
- Validasi client-side dengan `zod` — `endAt` harus setelah `startAt`, minimal 1 ticket type
- Submit via `createEvent` atau `updateEvent` server action
- Loading state saat submit dan saat upload poster

---

**5. Halaman Peserta** (`app/dashboard/events/[id]/attendees/page.tsx`)

Server Component untuk initial load.

Struktur file:
```
app/dashboard/events/[id]/
  attendees/
    page.tsx                         → Server Component
    _components/
      attendees-table.tsx            → Server Component
      checkin-button.tsx             → Client Component
      export-button.tsx              → Client Component
```

`AttendeesTable`:
- Kolom: nama, email, tipe tiket, status (badge), waktu registrasi, waktu check-in
- Filter status: Semua, Registered, Checked In, Absent

`CheckinButton` (Client Component):
- Input QR code manual (untuk fallback kalau kamera tidak tersedia)
- Invoke `checkInAttendee` server action
- Tampilkan hasil: nama peserta yang berhasil check-in, atau error message

`ExportButton` (Client Component):
- Tombol yang trigger download CSV via `GET /api/v1/events/[id]/attendees/export`
- Loading state saat download berlangsung

---

**6. Halaman Tiket Saya** (`app/dashboard/tickets/page.tsx`)

Server Component.

Tampilkan semua registrasi milik user yang login. Gunakan `GET /api/v1/registrations/my`.

Struktur file:
```
app/dashboard/tickets/
  page.tsx                           → Server Component
  _components/
    ticket-card.tsx                  → Server Component
    qr-code-display.tsx              → Client Component ("use client")
```

`TicketCard`:
- Info event: poster thumbnail, judul, tanggal, lokasi
- Info tiket: tipe tiket, status registrasi (badge)
- Tombol "Lihat QR Code" yang trigger modal

`QrCodeDisplay` (Client Component):
- Modal yang tampilkan QR code dalam ukuran besar
- Install dan gunakan library `qrcode.react` untuk generate QR code dari string `qrCode`
- Tampilkan juga kode tiket dalam teks di bawah QR code untuk fallback manual scan

---

**Catatan penting untuk agent:**
- Tidak ada hardcoded warna di manapun — selalu pakai CSS variables dari shadcn (`text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`, `bg-muted`, `border`, dll)
- Semua komponen yang butuh data organizer wajib validasi ownership di server — jangan rely pada client-side check saja
- Untuk Cloudinary signed upload, buat route handler `POST /api/v1/upload/signature` yang generate signed upload params — jangan expose `CLOUDINARY_API_SECRET` ke client
- `isOrganizer` check untuk redirect dilakukan di Server Component, bukan middleware — middleware hanya handle auth check
- Gunakan `notFound()` dari Next.js kalau event tidak ditemukan atau bukan milik organizer yang login

---

Sprint ini yang paling besar dari semua sprint UI. Kalau agent selesai, test berurutan:
1. Login → cek sidebar muncul sesuai `isOrganizer`
2. Buat event draft → publish → cek muncul di listing publik
3. Registrasi event dari halaman publik → cek muncul di Tiket Saya
4. Check-in peserta → cek status berubah
5. Export CSV → cek file terdownload dengan data benar
