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
