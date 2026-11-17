# Coffein

Sistem pemesanan untuk cafe: storefront pelanggan + panel admin + REST API.

## Struktur

- `apps/web` — Next.js (App Router): storefront + `/admin`
- `apps/api` — NestJS: REST API (products, orders, payments)
- `packages/shared` — tipe & schema Zod yang dipakai API dan web

## Development

```bash
pnpm install
docker compose -f docker-compose.dev.yml up -d   # PostgreSQL 16 (host port 5433)
pnpm dev                                          # turbo dev (web :3000, api :4000)
```

## Build

```bash
pnpm build
```

## Deploy Produksi (Docker)

```bash
cp .env.example .env        # lalu isi nilai produksi
docker compose up -d --build
```

Compose produksi menjalankan: `postgres` (internal) + `api` (:4000) + `web` (:3000).
Saat start, API otomatis menjalankan `prisma migrate deploy`; seed menu + admin
jalan jika `SEED_ON_START=true`.

### Environment Variables

| Variabel | Layanan | Default | Keterangan |
| --- | --- | --- | --- |
| `POSTGRES_USER` | postgres | `coffein` | User database |
| `POSTGRES_PASSWORD` | postgres | `coffein` | Password database |
| `POSTGRES_DB` | postgres | `coffein` | Nama database |
| `DATABASE_URL` | api | — (disusun compose) | Koneksi PostgreSQL |
| `JWT_SECRET` | api | **wajib diisi** | Secret signing JWT admin |
| `JWT_EXPIRES_IN` | api | `12h` | Masa berlaku token admin |
| `ADMIN_EMAIL` | api | `admin@coffein.id` | Email admin awal (seed) |
| `ADMIN_PASSWORD` | api | `admin12345` | Password admin awal (seed) — ganti di produksi! |
| `PAYMENT_PROVIDER` | api | `mock` | `mock` (dev) atau `mayar` |
| `MAYAR_API_KEY` | api | — | API key Mayar (wajib jika provider `mayar`) |
| `MAYAR_BASE_URL` | api | `https://api.mayar.id` | Base URL API Mayar |
| `MAYAR_WEBHOOK_SECRET` | api | — | Opsional: verifikasi signature webhook |
| `APP_URL` | api | `http://localhost:3000` | URL publik web (redirect payment link) |
| `SEED_ON_START` | api | `true` | Seed menu + admin saat start |
| `NEXT_PUBLIC_API_URL` | web (build arg) | `http://localhost:4000` | URL API yang dipakai browser |

### Pembayaran Midtrans + Cash

**Pilihan 1: Midtrans (Sandbox Development)**
1. Daftar akun di [Midtrans](https://midtrans.com) dan ambil Server Key untuk **sandbox** (bisa juga di Akun Production nanti).
2. Set `PAYMENT_PROVIDER=midtrans`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_SIGNATURE_SERVER_KEY`, dan `MIDTRANS_IS_PRODUCTION=false` di `.env`.
   - `MIDTRANS_IS_PRODUCTION=false` = mode **sandbox** (development/testing).
   - `MIDTRANS_IS_PRODUCTION=true` = mode **production** (lebih lanjut).
3. Daftarkan webhook URL ke `{APP_URL}/payments/webhook/midtrans` di dashboard Midtrans (sandbox).
4. Aktifkan metode pembayaran di dashboard Midtrans (QRIS, GoPay, ShopeePay, VA, kartu, dll) di sandbox environment.
5. Lakukan testing pembayaran di sandbox Midtrans menggunakan kartu uji coba yang disediakan Midtrans.
6. Saat ingin pindah ke produksi: atur `MIDTRANS_IS_PRODUCTION=true`, gunakan Server Key Production, dan daftarkan ulang webhook di domain produksi.

**Pilihan 2: Cash (Bayar di tempat)**

**Pilihan 2: Cash (Bayar di tempat)**
1. Set `PAYMENT_PROVIDER=cash` di `.env`.
2. Order dibuat dengan status PENDING dan paymentMethod=CASH.
3. Admin menandai order sebagai PAID melalui dashboard admin (`/admin/orders/:id/cash-paid`).
4. Tidak ada integrasi eksternal — cocok untuk pesanan offline/dinas.

**Alur pembayaran default (Midtrans):**
1. Pelanggan checkout → dinafikan ke hosted checkout Midtrans.
2. Pilih metode: QRIS, e-wallet, VA, atau kartu.
3. Midtrans webhook → order berubah status PAID.
4. User dialihkan ke `/order/{orderNumber}` atau `/thanks/{orderNumber}`.

**Alur pembayaran Cash:**
1. Pelanggan checkout → memilih "Cash (Bayar di tempat)".
2. Order dibuat: status PENDING, paymentUrl = halaman order sendiri.
3. Admin lihat order di dashboard → klik "Tandai Dibayar (Cash)".
4. Order berubah status PAID → stepper mulai (PREPARING → READY → COMPLETED).

Saat `PAYMENT_PROVIDER=mock` digunakan (development), alur pembayaran
melalui `/mock-pay/[orderNumber]` tetap tersedia untuk testing.
