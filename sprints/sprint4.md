**Task: Integrasi Midtrans + Payment Flow (Sprint 4)**

Konteks:
- Koneksi DB sudah pakai `@neondatabase/serverless` dengan WebSocket — wajib pakai `db.transaction()` untuk operasi atomik
- `registerEvent` action sudah ada di `src/actions/registrations.ts` — jangan diubah, flow berbayar dibuat terpisah
- Konvensi ada di `CONVENTIONS.md`
- Environment variables yang tersedia: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`

**Yang harus dikerjakan:**

**1. Midtrans helper** (`src/lib/midtrans.ts`)
- Install `midtrans-client`
- Inisialisasi Snap client dengan `isProduction: false` (sandbox dulu)
- Export fungsi `createSnapTransaction(orderId, amount, customerDetails)` — return `snapToken` dan `redirectUrl`
- Export fungsi `verifyWebhookSignature(payload)` — verifikasi signature key dari Midtrans sebelum proses webhook. Formula: `SHA512(orderId + statusCode + grossAmount + serverKey)`

**2. Server Action** (`src/actions/payments.ts`)

`initiatePayment(eventId, ticketTypeId)`:
- Validasi user sudah login
- Validasi event published, belum melewati `endAt`
- Validasi user belum registrasi event yang sama
- Validasi user bukan organizer event tersebut (`CANNOT_REGISTER_OWN_EVENT`)
- Validasi `ticketType.price > 0` — kalau gratis, throw `USE_FREE_FLOW`
- Validasi kuota dan kapasitas
- Jalankan dalam satu `db.transaction()`:
  - Insert row ke `registrations` dengan status `"registered"`, `qrCode` masih `null`
  - Generate `midtransOrderId` — format: `IVENTO-{registrationId}`
  - Insert row ke `transactions` dengan status `"pending"`, `amount` dari `ticketType.price`
  - Panggil `createSnapTransaction()` dengan data user dan amount
- Return `{ registrationId, transactionId, snapToken, paymentUrl }`

**3. Route Handlers**

`POST /api/v1/transactions/webhook`:
- Tidak pakai Bearer token — verifikasi via `verifyWebhookSignature()`
- Kalau signature invalid, return `400` langsung
- Handle `transaction_status`:
  - `settlement` atau `capture` → update transaksi ke `paid`, set `paidAt`, set `paymentMethod`, generate `qrCode` (`IVENTO-{registrationId}-{randomHash6char}`), update `qrCode` di registrasi — semua dalam satu `db.transaction()`
  - `deny`, `cancel`, `expire` → update transaksi ke `cancelled`, update registrasi ke `absent`, decrement `soldCount` di `ticketTypes` — semua dalam satu `db.transaction()`
  - Status lain (`pending`, dll) → log saja, return `200`
- Selalu return `200` ke Midtrans meskipun ada error internal — kalau return non-200, Midtrans akan retry terus

`GET /api/v1/transactions/[id]/status`:
- Auth required, harus pemilik transaksi
- Return `{ transactionId, status, midtransOrderId }` saja — endpoint ini di-polling TanStack Query setiap 5 detik, jangan return payload besar

`GET /api/v1/transactions/my`:
- Auth required
- Return riwayat transaksi milik user yang login
- Include relasi: registration → event (id, title), ticketType (name)
- Support query params: `page`, `limit`

**4. Queries** (`src/db/queries/transactions.ts`)
- `getTransactionById(id)` — include relasi registration dan event
- `getTransactionByMidtransOrderId(orderId)` — dipakai di webhook handler
- `getTransactionsByUser(userId, filters)`

**Catatan penting:**
- Webhook handler adalah satu-satunya tempat `qrCode` di-generate untuk event berbayar — jangan generate di tempat lain
- `db.transaction()` wajib dipakai di `initiatePayment` dan di webhook handler untuk kedua kondisi (paid dan cancelled) — ada multiple tabel yang diupdate sekaligus
- Jangan buat UI dulu
- Untuk testing webhook di local, gunakan **ngrok** atau **Midtrans Simulator** di dashboard sandbox — webhook tidak bisa diterima dari `localhost` langsung

---

**Task: Tambah Bruno Collection untuk Sprint 4**

Tambahkan folder baru di `/bruno`:

```
/bruno
  /transactions
    initiate-payment.bru         → invoke initiatePayment server action
    get-my-transactions.bru      → GET /api/v1/transactions/my
    get-transaction-status.bru   → GET /api/v1/transactions/[id]/status
  /webhook-simulation
    webhook-settlement.bru       → POST /api/v1/transactions/webhook (simulasi settlement)
    webhook-cancel.bru           → POST /api/v1/transactions/webhook (simulasi cancel)
    webhook-invalid-signature.bru → POST dengan signature salah
```

Buat juga temporary test route untuk invoke `initiatePayment` dengan hardcoded payload realistis.

Untuk `webhook-settlement.bru` dan `webhook-cancel.bru`, sertakan contoh payload Midtrans yang valid beserta cara generate signature-nya di komentar file Bruno.

---

Urutan testing setelah collection siap:

**Setup:**
- Pastikan ngrok sudah jalan dan webhook URL sudah diset di Midtrans Sandbox Dashboard
- Pastikan ada event published dengan ticket type berbayar di database

**Happy path — flow settlement:**
1. Invoke `initiatePayment` → catat `transactionId` dan `midtransOrderId`
2. Cek DB — `transactions` status `pending`, `registrations.qrCode` masih `null`
3. Poll `GET /transactions/[id]/status` → return `pending`
4. Buka Midtrans Sandbox Dashboard → set status order ke `settlement`
5. Cek ngrok dashboard — webhook request masuk
6. Cek DB — `transactions.status` berubah ke `paid`, `paidAt` terisi, `registrations.qrCode` sudah terisi
7. Poll `GET /transactions/[id]/status` lagi → sekarang return `paid`
8. Cek `GET /transactions/my` → transaksi muncul dengan status `paid`

**Happy path — flow cancel/expire:**
1. Invoke `initiatePayment` baru → catat ID
2. Set status ke `expire` via Midtrans Simulator
3. Cek DB — `transactions.status` → `cancelled`, `registrations.status` → `absent`
4. Cek `ticketTypes.soldCount` — harus berkurang kembali

**Edge cases:**
- Hit webhook dengan signature salah → return `400`
- Poll `GET /transactions/[id]/status` milik user lain → `403`
- Invoke `initiatePayment` untuk event gratis → error `USE_FREE_FLOW`
- Invoke `initiatePayment` untuk event yang sama dua kali → error `ALREADY_REGISTERED`
- Invoke `initiatePayment` untuk event milik sendiri → error `CANNOT_REGISTER_OWN_EVENT`
