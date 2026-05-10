**Server Actions** → mutasi yang dipanggil dari form internal:
- Buat event, edit event, hapus event
- Update profil user
- Registrasi event gratis
- Check-in peserta (dari form scan QR di dashboard)

**Route Handlers** → mutasi yang dipanggil dari luar Next.js atau butuh response non-JSON:
- `POST /api/v1/transactions/webhook` — dipanggil Midtrans
- `GET /api/v1/events/:id/attendees/export` — return CSV bukan JSON
- `POST /api/v1/registrations` untuk event berbayar — perlu return `paymentUrl` Midtrans yang kemudian di-redirect client

**TanStack Query** → semua data fetching client-side yang dinamis:
- Polling status transaksi (`GET /api/v1/transactions/:id/status`)
- Search dan filter event real-time
- Dashboard organizer (data sering berubah)

## Component Architecture

### Server vs Client Components
- **Default ke Server Component** — jangan tambah "use client" kalau tidak perlu
- **"use client" hanya untuk:**
  - Komponen yang pakai useState / useEffect / hooks
  - Event handlers (onClick, onChange, onSubmit)
  - TanStack Query (useQuery, useMutation)
  - Browser APIs

### Pemisahan yang wajib diikuti
Kalau satu halaman butuh campuran server dan client:
- Buat server component sebagai parent (fetch data di sini)
- Pass data sebagai props ke child client component
- Jangan fetch data di client component kalau bisa dilakukan di server

Contoh struktur yang benar:
  app/events/page.tsx              → Server Component (fetch data)
  app/events/_components/
    event-list.tsx                 → Server Component (render list)
    event-filter.tsx               → Client Component (interaktif)
    event-card.tsx                 → Server Component (presentational)

### File & Folder Naming
- Folder: kebab-case
- Component files: kebab-case (event-card.tsx, bukan EventCard.tsx)
- Component export: PascalCase (export function EventCard)
- Folder _components hanya untuk komponen lokal halaman itu
- Komponen shared di src/components/

### Clean Code Rules
- Satu file maksimal 150 baris — kalau lebih, pecah jadi subkomponen
- Tidak ada logic bisnis di komponen UI — logic di server actions atau query functions
- Tidak ada hardcoded string yang tampil ke user — taruh di konstanta atau langsung inline tapi konsisten
- Props interface wajib didefinisikan eksplisit, jangan pakai any

### Data Fetching
- Server Components: fetch langsung via query functions di src/db/queries/
- Client Components: TanStack Query untuk data yang dinamis/sering berubah
- Jangan campurkan keduanya di komponen yang sama