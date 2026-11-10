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

### Pembayaran Mayar

1. Buat akun Mayar + ambil API key.
2. Set `PAYMENT_PROVIDER=mayar` dan `MAYAR_API_KEY` di `.env`.
3. Daftarkan webhook Mayar ke `{APP_URL}` → API menerima event `payment.received`
   di `POST /payments/webhook/mayar` untuk menandai pesanan PAID.
4. Jika Mayar menyediakan secret signature, set `MAYAR_WEBHOOK_SECRET` agar
   verifikasi signature aktif.

Sampai API key tersedia, provider `mock` memungkinkan alur pembayaran lengkap
via halaman `/mock-pay/[orderNumber]` (khusus development).
