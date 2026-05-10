**Task: Sprint UI — Auth Pages (Login & Register)**

Konteks:
- Next.js 16 App Router + TypeScript
- Styling: Tailwind CSS + shadcn/ui default theme
- Auth: Auth.js v5 — gunakan helper `getSession()` yang sudah ada
- Pastikan mengikuti Konvensi yang ada di `CONVENTIONS.md`

**Yang harus dikerjakan:**

**1. Layout Auth** (`src/app/(auth)/layout.tsx`)
- Layout sederhana — centered card di tengah halaman
- Tampilkan logo/nama "Ivento" di atas card
- Tidak ada navbar

**2. Halaman Register** (`src/app/(auth)/register/page.tsx`)
- Form fields: `name`, `email`, `password`, `role` (radio atau select: Participant / Event Organizer)
- Validasi client-side dengan `zod` + `react-hook-form`
- Submit via `registerUser` server action — buat action ini di `src/actions/auth.ts`
- State: loading saat submit, error message kalau gagal (email already exists, dll)
- Link ke halaman login di bawah form

**3. Halaman Login** (`src/app/(auth)/login/page.tsx`)
- Form fields: `email`, `password`
- Tombol "Continue with Google" — trigger Auth.js Google OAuth
- Submit via Auth.js `signIn("credentials", ...)` 
- State: loading, error message kalau credentials salah
- Link ke halaman register di bawah form
- Setelah login berhasil, redirect ke `/dashboard`

**4. Server Action** (`src/actions/auth.ts`)

`registerUser(data)`:
- Validasi input dengan zod
- Hash password dengan `bcryptjs`
- Insert ke tabel `users`
- Auto sign-in setelah register berhasil via Auth.js
- Redirect ke `/dashboard`

**5. Route protection**
- `/dashboard` belum ada halamannya — cukup buat `src/app/dashboard/page.tsx` placeholder sederhana yang tampilkan nama dan role user dari session
- Kalau user sudah login coba akses `/login` atau `/register`, redirect ke `/dashboard`

**Catatan penting:**
- Gunakan shadcn components: `Button`, `Input`, `Label`, `Card`, `Form`
- Semua form pakai `react-hook-form` + `zod` — jangan pakai HTML `<form>` action langsung tanpa hook
- Error dari server action di-surface ke UI — jangan `console.log` saja
- Responsive: mobile dan desktop harus proper, card tidak boleh overflow di mobile

---