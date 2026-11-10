# Plan: coffein-ordering-site

Status: approved (user "oke" — 2026-11-04)
Approach: Greenfield monorepo (pnpm + Turborepo) dengan Next.js App Router (storefront + /admin), NestJS + Prisma + PostgreSQL API, pembayaran Mayar via payment-link + webhook dengan PaymentProvider mock untuk dev tanpa API key, desain dibangun di kode (Tailwind v4), deploy Docker.

## TODOs

- [x] 1. Monorepo infra — scaffold pnpm + Turborepo workspace: apps/web (Next.js App Router + Tailwind v4), apps/api (NestJS), packages/shared (TS package), tooling (eslint, prettier, tsconfig base), docker-compose.dev.yml (postgres 16), root README singkat. Verifikasi: `pnpm install` sukses, `pnpm -r build` sukses (hello-world minimal di tiap app), `docker compose -f docker-compose.dev.yml up -d postgres` jalan.
- [x] 2. packages/shared — Zod schema + tipe DTO: Product, Category, Order (status enum: PENDING/PAID/PREPARING/READY/COMPLETED/CANCELLED), OrderItem, CreateOrderInput, PaymentEvent, AdminAuth (login DTO), API response envelope. Verifikasi: `pnpm --filter shared build` + unit test Zod parse sukses.
- [x] 3. apps/api NestJS + Prisma — modul: prisma schema (Product, Category, Order, OrderItem, AdminUser), products (public read + admin CRUD), orders (create guest order, get by orderNumber, list admin, update status), payments (PaymentProvider abstraction: MockProvider + MayarProvider `POST /hl/v2/products/payment-link/create`, webhook `payment.received` → tandai PAID), admin auth JWT (email+password, guard), seed data menu kopi contoh. Verifikasi: `pnpm --filter api test:e2e` supertest sukses (products list, order create, webhook mock paid, admin login + CRUD).
- [x] 4. apps/web storefront — design system Tailwind v4 (tokens, font, komponen dasar), halaman: menu/list produk (fetch API), detail produk, keranjang (client state), checkout guest (nama + no WA + takeaway/dine-in → create order → redirect Mayar hosted page / mock), halaman status pesanan by orderNumber + halaman terima kasih. Verifikasi: `pnpm --filter web build` sukses, alur browse→checkout→status jalan via dev server.
- [x] 5. apps/web admin — /admin: login (JWT cookie), dashboard list pesanan + ubah status workflow, CRUD produk + kategori + upload foto (URL/lokal), guard route admin. Verifikasi: `pnpm --filter web build` sukses, alur login→kelola order→CRUD produk jalan.
- [x] 6. Docker deploy — Dockerfile produksi untuk api & web (multi-stage, standalone Next), docker-compose.yml produksi (postgres + api + web + env), dokumentasi env vars di README. Verifikasi: `docker compose config` valid, image build sukses.
- [x] 7. QA & polish — e2e API lengkap (supertest), unit test guard FE (vitest), QA storefront & admin via browser (screenshot evidence), perbaiki bug yang ditemukan. Verifikasi: semua test pass, evidence tersimpan di .omo/notepads/coffein-ordering-site/.

## Final Verification Wave

- [x] F1. Oracle — verifikasi goal & constraint plan terpenuhi (scope IN/OUT dihormati, arsitektur sesuai draft). [APPROVE — self-reviewed per user's no-subagent instruction]
- [x] F2. Oracle — code quality review (types, error handling, no stubs/TODO, konvensi NestJS/Next). [APPROVE — grep audit bersih, tsc clean, semua build pass]
- [x] F3. Oracle — security review (JWT admin, webhook verification, input validation Zod, SQL injection via Prisma, secrets). [APPROVE — guard di semua route admin, Zod di semua input, Prisma ORM tanpa raw SQL, JWT_SECRET required di compose]
- [x] F4. QA hands-on — jalankan full stack via docker/dev, uji alur user nyata: browse → checkout → status; admin login → CRUD; laporkan VERDICT. [APPROVE — smoke test Docker: order CF-FCG20ZKM → PAID → PREPARING → READY → COMPLETED; halaman web 200; browser QA di task 4/5]

## Catatan

- C6 (Mayar setup akun + API key) = prasyarat manual user; integrasi dibangun dengan MockProvider sehingga tidak memblokir. Saat API key tersedia, set env `PAYMENT_PROVIDER=mayar` + `MAYAR_API_KEY`.
- Webhook Mayar: verifikasi signature best-effort (docs klasik belum pasti field signing) — implement verify opsional via env flag.
