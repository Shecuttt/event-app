# 🎪 Ivento - Event Management & Marketplace App

**Ivento** adalah platform manajemen dan pasar (*marketplace*) event modern yang dirancang untuk memperlancar seluruh alur penyelenggaraan acara—mulai dari pembuatan event, pemasaran, penjualan tiket, pembayaran online terintegrasi, hingga proses masuk (*check-in*) di lokasi acara dengan QR Code.

Aplikasi ini dibangun menggunakan framework **Next.js** terbaru dengan arsitektur App Router dan performa tinggi, serta dikembangkan dengan standar kode yang bersih dan terstruktur untuk mempermudah pengembangan lebih lanjut.

---

## 🚀 Fitur Utama

### 1. Bagi Penyelenggara (Organizer)
*   📊 **Dashboard Overview**: Pantau total event aktif (status `published`), draft, total peserta terdaftar, dan akumulasi pendapatan kotor (*gross revenue*) dari penjualan tiket secara real-time.
*   📅 **Manajemen Event Mandiri**: Buat, edit, terbitkan, batalkan, atau selesaikan event dengan kontrol penuh atas konten, poster, kategori, kuota, dan jadwal pelaksanaan.
*   🎟️ **Tiketing Dinamis**: Buat beberapa tipe tiket (misal: *Gratis*, *Regular*, *VIP*) dengan harga dan kuota unik untuk setiap event.
*   👥 **Manajemen & Ekspor Peserta**: Pantau daftar peserta yang telah membeli tiket atau mendaftar secara langsung, dan ekspor data peserta ke format CSV secara instan.
*   📸 **Check-In Berbasis QR Code**: Verifikasi tiket peserta di lapangan secara cepat dengan memindai kode QR tiket mereka atau memasukkan kode tiket manual untuk pencatatan kehadiran.

### 2. Bagi Peserta / Pembeli (Buyer)
*   🔍 **Eksplorasi Event**: Temukan berbagai event menarik dengan filter dinamis berdasarkan kategori (Musik, Seminar, Olahraga, Workshop, Komunitas, dll) secara real-time.
*   💳 **Pembayaran Terintegrasi (Midtrans)**: Nikmati pembayaran tiket berbayar yang aman dan otomatis menggunakan payment gateway Midtrans (mendukung e-wallet, transfer bank/virtual account, kartu kredit, dll).
*   🎟️ **E-Ticket & QR Code Dinamis**: Akses tiket yang telah dibeli di menu **Tiket Saya** yang dilengkapi dengan generator QR Code dinamis untuk mempercepat pemindaian saat berada di lokasi acara.
*   🔓 **Autentikasi Fleksibel**: Registrasi dan login aman menggunakan akun Google OAuth atau email & password (Credentials).

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

Aplikasi ini menggunakan teknologi modern terbaik di ekosistem JavaScript/TypeScript untuk menjamin performa, keamanan, dan skalabilitas:

*   **Framework**: [Next.js](https://nextjs.org) (v16.2) dengan Next.js App Router (mengoptimalkan Server & Client Components secara terpisah)
*   **Database**: PostgreSQL yang di-host di [Neon Serverless Database](https://neon.tech)
*   **ORM**: [Drizzle ORM](https://orm.drizzle.team) untuk penulisan skema basis data dan query yang type-safe
*   **Autentikasi**: [Auth.js / NextAuth](https://authjs.dev) (v5 Beta) dengan Drizzle Adapter
*   **Styling & UI**: [Tailwind CSS](https://tailwindcss.com) (v4) & [Shadcn UI](https://ui.shadcn.com) untuk antarmuka pengguna yang modern, konsisten, dan responsif (menggunakan CSS Variables)
*   **Payment Gateway**: [Midtrans Client SDK](https://midtrans.com) untuk gerbang pembayaran lokal di Indonesia (mode Sandbox untuk simulasi)
*   **Penyimpanan Media**: [Cloudinary SDK](https://cloudinary.com) untuk penyimpanan poster event yang aman menggunakan signed-signature upload dari sisi klien
*   **State & Query Management**: [TanStack React Query](https://tanstack.com/query) (v5) untuk polling status transaksi dan sinkronisasi data interaktif client-side

---

## 📁 Struktur Database (Skema Drizzle)

Skema basis data dirancang untuk efisiensi kueri dan keandalan integritas data. Hubungan antar tabel dapat dilihat di berkas [schema.ts](file:///home/goru/projects/event-app/src/db/schema.ts).

Berikut adalah representasi hubungan relasional antar tabel utama:

```mermaid
erDiagram
    users ||--o{ accounts : "has"
    users ||--o{ sessions : "has"
    users ||--o{ events : "organizes"
    users ||--o{ registrations : "registers"
    events ||--o{ ticket_types : "has"
    events ||--o{ registrations : "has"
    ticket_types ||--o{ registrations : "applies_to"
    registrations ||--|| transactions : "creates"
```

### Penjelasan Tabel:
1.  **`users`**: Menyimpan profil dasar pengguna, status peran (`isOrganizer`), dan sandi terenkripsi.
2.  **`accounts` & `sessions`**: Mengatur sesi autentikasi pengguna (dikelola otomatis oleh Auth.js).
3.  **`events`**: Menyimpan detail acara, tanggal pelaksanaan (`startAt`, `endAt`), kategori, kapasitas maksimal, dan detail lokasi (online/offline).
4.  **`ticket_types`**: Tipe-tipe tiket yang tersedia untuk suatu event beserta kuota dan harganya (harga `0` = Gratis).
5.  **`registrations`**: Pencatatan pendaftaran pengguna ke suatu event dengan status kehadiran (`registered`, `checked_in`, `absent`) dan kode QR unik.
6.  **`transactions`**: Pencatatan transaksi pembayaran untuk pendaftaran event berbayar melalui Midtrans.

---

## 📐 Arsitektur & Konvensi Kode

Pengembangan proyek ini mengikuti aturan ketat demi menjaga kualitas kode yang seragam. Informasi lengkap mengenai panduan ini tercantum pada [CONVENTIONS.md](file:///home/goru/projects/event-app/CONVENTIONS.md):

> [!IMPORTANT]
> **Aturan Utama Pemisahan Komponen (Server vs Client)**
> *   Secara default, buat halaman/komponen sebagai **Server Component** untuk meminimalisir ukuran JavaScript di browser dan mempercepat waktu muat.
> *   Gunakan arahan `"use client"` **hanya** ketika Anda memerlukan hook interaktif (seperti `useState`, `useEffect`), penanganan aksi pengguna (`onClick`, `onSubmit`), atau library client-side seperti TanStack Query dan QR Code renderer.
> *   Dilarang keras menyatukan kueri basis data dan logika interaktif di komponen yang sama. Ambil data di komponen induk (Server Component) dan kirimkan hasilnya sebagai props ke komponen anak (Client Component).

*   **Server Actions**: Digunakan untuk mutasi data internal (seperti membuat/mengedit event, pendaftaran tiket gratis, check-in peserta, dan pembaruan profil). Kode diletakkan di dalam folder [src/actions](file:///home/goru/projects/event-app/src/actions).
*   **Route Handlers (API)**: Digunakan untuk integrasi dengan pihak ketiga atau respons non-JSON (seperti Webhook Midtrans, unggah file, dan ekspor data peserta ke CSV). Berkas diletakkan di bawah folder [app/api](file:///home/goru/projects/event-app/app/api).
*   **Penamaan Berkas & Folder**: Folder dan nama berkas komponen wajib menggunakan format `kebab-case` (contoh: `event-card.tsx`). Ekspor komponen menggunakan format `PascalCase` (contoh: `export function EventCard`).

---

## 🛠️ Langkah Instalasi & Persiapan Lokal

### Prasyarat
*   Node.js versi 20 ke atas.
*   Package manager **pnpm** (gunakan `pnpm install`, dilarang menggunakan `npm` atau `yarn` karena adanya validasi `preinstall`).

### 1. Unduh Proyek & Pasang Dependensi
Navigasikan terminal Anda ke direktori proyek dan jalankan perintah:
```bash
pnpm install
```

### 2. Konfigurasi Lingkungan (Environment Variables)
Salin berkas template [.env.example](file:///home/goru/projects/event-app/.env.example) menjadi berkas `.env`:
```bash
cp .env.example .env
```
Isi variabel lingkungan yang dibutuhkan berikut ini di dalam berkas `.env`:
```env
# ─── DATABASE ─────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# ─── AUTHENTICATION (Auth.js) ─────────────────────────────────────────────────
AUTH_SECRET="hasil-generate-rahasia" # Generate menggunakan command: npx auth secret

# ─── GOOGLE OAUTH (Opsional untuk Login Google) ──────────────────────────────
AUTH_GOOGLE_ID="id-client-dari-google-console"
AUTH_GOOGLE_SECRET="rahasia-client-dari-google-console"

# ─── MIDTRANS (Payment Gateway Sandbox) ──────────────────────────────────────
MIDTRANS_SERVER_KEY="sandbox-server-key-anda"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="sandbox-client-key-anda"

# ─── CLOUDINARY (Upload Poster Event) ─────────────────────────────────────────
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="nama-cloud-cloudinary"
CLOUDINARY_API_KEY="api-key-cloudinary"
CLOUDINARY_API_SECRET="api-secret-cloudinary"
```

### 3. Migrasi Skema Database
Pastikan `DATABASE_URL` sudah terhubung ke Neon PostgreSQL Anda, kemudian sinkronisasikan skema Drizzle ke database:
```bash
npx drizzle-kit push
```

### 4. Pengisian Data Awal (Database Seeding)
Untuk mempercepat pengujian aplikasi, jalankan skrip seeding [seed.ts](file:///home/goru/projects/event-app/scripts/seed.ts) untuk memasukkan beberapa data contoh (organizer contoh, event konser musik, seminar teknologi, yoga gratis, lengkap dengan tipe tiketnya):
```bash
npx tsx scripts/seed.ts
```

> [!NOTE]
> Akun default hasil seeding untuk login Organizer:
> *   **Email**: `organizer@ivento.com`
> *   **Password**: *(Silakan daftar baru dengan email tersebut atau login menggunakan kredensial yang dibuat)*

### 5. Jalankan Server Pengembangan
Jalankan aplikasi di lingkungan lokal:
```bash
pnpm dev
```
Buka peramban (browser) Anda di alamat [http://localhost:3000](http://localhost:3000) untuk mengakses aplikasi Ivento.

---

## 🌐 Alur Integrasi & Webhook Penting

*   **Webhook Midtrans**: Handler Webhook berada pada endpoint `POST /api/v1/transactions/webhook`. Endpoint ini bertugas mendengarkan notifikasi pembayaran dari Midtrans secara asinkron untuk memperbarui status transaksi menjadi `paid` atau `cancelled`, serta membuat registrasi e-tiket peserta menjadi aktif beserta pembuatan QR Code unik.
*   **Signed Cloudinary Upload**: Untuk keamanan berkas rahasia, pengunggahan poster event dari browser tidak menggunakan kunci API publik biasa, melainkan meminta tanda tangan digital khusus melalui endpoint `POST /api/v1/upload/signature` sebelum dikirimkan ke Cloudinary.

---

## 📄 Lisensi & Kontribusi

Silakan ajukan *Pull Request* atau laporkan masalah jika Anda menemukan celah keamanan, kesalahan kode, atau ingin menambahkan fitur baru pada platform **Ivento**. Ikuti selalu instruksi arsitektur pada berkas [CONVENTIONS.md](file:///home/goru/projects/event-app/CONVENTIONS.md) demi kenyamanan pengembangan tim.

Selamat berkarya bersama **Ivento**! 🚀
