**Task: Sprint UI — Update Auth Pages + Halaman Utama**

Konteks:
- Breaking changes sudah diterapkan — tidak ada role selection, tidak ada `requireRole`
- Konvensi komponen ada di `CONVENTIONS.md` — ikuti ketat, terutama server/client separation
- Shadcn default theme
- Semua page.tsx harus Server Component — tidak boleh ada `"use client"` di level page

---

**1. Update Register Page**

`src/app/(auth)/register/_components/register-form.tsx`:
- Hapus field role selection
- Form sekarang hanya: `name`, `email`, `password`
- Tambah tombol "Continue with Google" — sama seperti login page

---

**2. Update Login Page**

Tidak ada perubahan logic, tapi pastikan:
- Redirect setelah login ke `/` (landing page) bukan `/dashboard`
- Error message sudah proper untuk credentials salah

---

**3. Landing Page** (`src/app/page.tsx`)

Server Component. Layout:
- Navbar: logo "Ivento" di kiri, tombol "Login" dan "Buat Event" di kanan. Kalau sudah login, ganti tombol "Login" dengan avatar/nama user
- Hero section: headline, subheadline, tombol CTA "Jelajahi Event" yang scroll ke section listing
- Section listing event: tampilkan 6 event published terbaru, gunakan `getPublishedEvents()` yang sudah ada
- Footer sederhana

Struktur file:
```
src/app/
  page.tsx                           → Server Component
  _components/
    navbar.tsx                       → Server Component
    hero-section.tsx                 → Server Component
    event-section.tsx                → Server Component
    event-card.tsx                   → Server Component
```

`EventCard` menampilkan: poster event, judul, tanggal, lokasi, kategori, harga terendah atau "Gratis".

---

**4. Halaman Listing Event** (`src/app/events/page.tsx`)

Server Component untuk initial render, Client Component untuk filter interaktif.

Struktur file:
```
src/app/events/
  page.tsx                           → Server Component, terima searchParams
  _components/
    event-grid.tsx                   → Server Component
    event-filters.tsx                → Client Component ("use client")
```

`page.tsx`:
- Terima `searchParams` untuk filter dan pagination
- Panggil `getPublishedEvents(filters)` berdasarkan searchParams
- Pass data ke `EventGrid`
- Pass current filters ke `EventFilters`

`EventFilters` (Client Component):
- Filter: kategori (pills/tabs), tipe (gratis/berbayar), lokasi (online/offline)
- Search input dengan debounce 300ms
- Setiap perubahan filter update URL query params via `useRouter` — bukan state lokal
- Dengan begitu filter bisa di-share via URL dan halaman tetap SSR-friendly

`EventGrid`:
- Render grid `EventCard` — import dari `src/components/event-card.tsx` (pindahkan ke sini karena dipakai di landing page juga)
- Pagination sederhana di bawah grid

---

**5. Halaman Detail Event** (`src/app/events/[id]/page.tsx`)

Server Component.

Struktur file:
```
src/app/events/[id]/
  page.tsx                           → Server Component
  _components/
    event-header.tsx                 → Server Component
    ticket-section.tsx               → Client Component ("use client")
```

`page.tsx`:
- Panggil `getEventById(id)` — kalau tidak ditemukan atau bukan `published`, `notFound()`
- Generate metadata dinamis: title, description, og:image dari posterUrl

`EventHeader`:
- Poster event (full width atau di sisi kanan)
- Judul, kategori, tanggal, lokasi, deskripsi (render markdown)
- Info organizer

`TicketSection` (Client Component):
- Tampilkan semua ticket types dengan harga dan sisa kuota
- Tombol "Daftar Sekarang" atau "Beli Tiket"
- Kalau belum login → redirect ke `/login`
- Kalau event gratis → invoke `registerEvent` server action langsung
- Kalau event berbayar → invoke `initiatePayment`, redirect ke `paymentUrl` Midtrans
- Loading state saat action berlangsung
- Tampilkan pesan sukses setelah registrasi berhasil

---

**Catatan penting untuk agent:**
- `EventCard` adalah shared component — taruh di `src/components/event-card.tsx`, bukan di `_components`
- Navbar perlu tau apakah user sudah login — fetch session di `navbar.tsx` (Server Component), bukan di client
- Untuk render markdown deskripsi event, install dan gunakan `react-markdown`
- Semua gambar dari Cloudinary gunakan `next/image` dengan domain Cloudinary di `next.config.ts`
- Jangan hardcode apapun — semua data dari DB
