**Task: Setup Auth.js (NextAuth v5)**

Konteks project:
- Next.js 14 App Router + TypeScript
- Database: Neon PostgreSQL, ORM: Drizzle
- Schema sudah ada di `src/db/schema.ts` — gunakan tabel `users` yang sudah ada, jangan buat tabel baru
- Auth strategy: email/password + Google OAuth

Yang harus dikerjakan:
1. Install dan konfigurasi Auth.js v5 (`next-auth@beta`)
2. Setup Drizzle Adapter — gunakan adapter resmi `@auth/drizzle-adapter`
3. Credentials provider untuk email/password — password di-hash dengan `bcryptjs`, disimpan di kolom `passwordHash`
4. Google OAuth provider
5. Middleware untuk protect route — semua `/dashboard/*` dan `/api/v1/*` (kecuali `GET /api/v1/events` dan `POST /api/v1/transactions/webhook`) wajib authenticated
6. Extend session untuk include `id` dan `role` dari tabel `users`
7. Buat dua helper function: `getSession()` untuk server components, `requireRole(role)` untuk route handlers yang butuh role check — lempar `403` kalau role tidak sesuai

Environment variables yang sudah tersedia:
```
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
DATABASE_URL
```

Jangan buat UI login dulu — fokus ke konfigurasi dan helper functions saja.

---

*Testing*

Bikin **3 route handler sementara** khusus untuk testing, lalu hapus setelah verified:

```
GET /api/test/session     → log dan return session saat ini
GET /api/test/protected   → pakai requireRole("organizer"), return 403 atau data
GET /api/test/middleware   → kalau kena redirect, middleware jalan
```

Hit via browser langsung — `localhost:3000/api/test/session`. Lihat output JSON-nya. Setelah verified, hapus folder `/api/test`.
