---
slug: coffein-ordering-site
status: drafting
intent: clear
review_required: false
pending-action: write .omo/plans/coffein-ordering-site.md
approach: Greenfield monorepo (pnpm + Turborepo) dengan aplikasi Next.js (App Router) sebagai storefront + admin, backend NestJS + PostgreSQL (Prisma), integrasi pembayaran Mayar (QRIS/e-wallet/VA), dibangun berurutan: desain Figma → FE storefront → BE API → pembayaran → admin order management.
---

# Draft: coffein-ordering-site

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| id | component | outcome | status |
| --- | --- | --- | --- |
| C1 | Monorepo infra | pnpm + Turborepo, apps/web + apps/api + packages/shared, tooling (eslint/prettier/docker-compose dev) | active |
| C2 | packages/shared | tipe + Zod schema DTO yang dipakai API dan web (order, product, payment events) | active |
| C3 | apps/api NestJS | REST API: modul products, orders, payments (abstraksi PaymentProvider: Mayar + mock), admin auth JWT, webhook Mayar | active |
| C4 | apps/web storefront | Next.js App Router: menu/list produk, detail produk, checkout guest (Mayar hosted page), status pesanan + halaman terima kasih | active |
| C5 | apps/web admin | /admin (login admin): CRUD produk + kategori + foto, manajemen pesanan (status workflow) | active |
| C6 | Mayar setup | registrasi akun, API key Read&Write, konfigurasi webhook URL, test via web.mayar.io | active (prasyarat manual) |
| C7 | Deploy Docker | docker-compose dev (postgres + api + web) + Dockerfile produksi VPS | active |

## Open assumptions (announced defaults)
<!-- assumption | adopted default | rationale | reversible? -->

| assumption | adopted default | rationale | reversible? |
| --- | --- | --- | --- |
| Desain | Dibangun langsung di kode (Tailwind v4, design tokens; referensi Dribbble dari riset), Figma bukan input wajib | dipilih user di gate | ya |
| ORM | Prisma + PostgreSQL di NestJS | dukungan NestJS resmi + migrasi matang | ya |
| Admin panel | Satu Next.js app, route /admin dengan auth terpisah | lebih murah di-maintain daripada app admin terpisah | ya |
| Produk dikelola admin | CRUD produk lengkap (nama, deskripsi, harga, kategori, foto, availability) | prasyarat logis fitur list produk | ya |
| Order workflow status | pending → paid → preparing → ready → completed + cancelled | cukup untuk operasi cafe | ya |
| Testing | tests-after: supertest e2e API + vitest unit web payment-guard | QA agent-executable | ya |
| AI-assisted | Plan decision-complete untuk eksekusi agent; tidak ada pilihan yang diserahkan ke implementer | sesuai cara kerja opencode + LLM gratis | ya |

## Findings (cited - path:lines)

### Mayar Payments (sumber: docs.mayar.id, dev.mayar.id, websearch 2026-11-03)
- Mayar Headless API V2: base `https://api.mayar.id`, auth `Authorization: Bearer <API_KEY>`. API key dibuat di `https://web.mayar.id/api-keys` (pilihan Read-Only vs Read&Write). https://docs.mayar.id/api-reference-v2/introduction
- Buat payment link: `POST /hl/v2/products/payment-link/create` → body {name, amount (integer rupiah), description, redirectUrl, expiredAt, notes} → response {id, link}. Customer dibayar di halaman hosted checkout Mayar. https://docs.mayar.id/api-reference-v2/genericlink/createpaymentlink
- Metode pembayaran Mayar: QRIS, Virtual Account (real-time), e-wallet (GoPay, OVO, Dana, ShopeePay, LinkAja), Kartu Visa/Mastercard, Retail (Alfamart/Indomaret), transfer bank manual. https://docs.mayar.id/onlinepaymentmethod — dengan payment link, pemilih metode terjadi di hosted page Mayar (tidak perlu integrasi per-metode).
- Webhook: dikonfigurasi via dashboard Mayar (Integration → Webhook, satu field URL). Format JSON POST, event `payment.received`, `payment.reminder`, dll. Payload berisi data.amount, data.productName, data.productId, data.customerName/Email/Mobile, data.custom_field. https://docs.mayar.id/integration/webhook — Verify payload/webhook signature: dev.mayar.id menyebut "signed webhooks" untuk API developer baru (dev.mayar.id); detail signing field belum terverifikasi dari docs klasik.
- Testing environment: `web.mayar.io` dipakai untuk testing (sandbox-ish), produksi `web.mayar.id`. docs.mayar.id/integration/webhook. Perlu akun Mayar aktif untuk API key.
- Integrasi yang dipilih: order di web kita → BE NestJS membuat payment link per-order (name = nomor order) → customer dialihkan ke hosted page Mayar → webhook `payment.received` → BE menandai order PAID → redirect kembali via redirectUrl.
- Rate limit API terdokumentasi (docs.mayar.id/api-reference-v2/rate-limit).

###Stack
- Repo kerja kosong (greenfield); tidak ada konvensi existing yang harus diikuti.

## Decisions (with rationale)

1. **Payment via Mayar payment-link + webhook** (bukan integrasi per-metode): order dibuat di BE → BE `POST /hl/v2/products/payment-link/create` (name = nomor order, custom_field = order ref) → FE redirect ke hosted page Mayar → semua metode (QRIS/ewallet/VA/kartu) dipilih customer di sana → webhook `payment.received` → BE tandai order PAID → redirectUrl kembali ke halaman status pesanan. Sumber: docs.mayar.id (draft ## Findings).
2. **PaymentProvider abstraction** (gateway mock untuk dev tanpa API key + adapter Mayar) karena akun Mayar belum ada — integrasi tetap bisa dibangun & dites dengan mock, lalu di switch ke web.mayar.io saat API key tersedia.
3. **Monorepo pnpm + Turborepo**, shared package berisi Zod schema → tipe FE dan BE selalu sinkron.
4. **Desain di kode** — design system Tailwind v4 dari awal, halaman dibangun mengikuti referensi riset Dribbble; selektor ini dipilih user.
5. **Guest checkout** — identitas order = nama + nomor WA + metode (takeaway/dine-in); nomor order pendek dibagikan agar staff cafe bisa tracking manual.

## Scope IN

- Setup monorepo + tooling + docker-compose dev (PostgreSQL).
- apps/api NestJS + Prisma: modul products (public read), orders, payments (mock + Mayar), webhook Mayar, admin auth (JWT email+password), seed data menu contoh.
- apps/web Next.js: design system, storefront (menu + detail + keranjang + checkout + status pesanan), admin (/admin: login, CRUD produk, manajemen pesanan + perubahan status penyajangan).
- Integrasi Mayar end-to-end dengan web.mayar.io (testing), termasuk langkah manual setup akun Mayar.
- QA: e2e API (supertest), unit guard FE (vitest), QA storefront & admin via browser evidence.

## Scope OUT (Must NOT have)

- Tidak ada registrasi/login pelanggan (guest-only checkout).
- Tidak ada integrasi QRIS/VA/ewallet per-channel langsung dari BE (metode dipilih di hosted page Mayar).
- Tidak ada reservasi meja, loyalty/poin, notification WA/email blast, multi-outlet, aplikasi mobile.
- Tidak ada dashboard analitik mendalam di admin (cukup list order dan ubah status).
- Tidak ada deployment otomatis CI/CD — deliverable Dockerfile + compose; VPS-nyata di luar rencana ini.

## Open questions

- Tidak ada — semua fork terselesaikan (owner-decisions di q` gate; sisanya default teradopsi di tabel atas).

## Approval gate
status: awaiting-approval
approach: Monorepo pnpm+Turborepo; apps/web Next.js (storefront + /admin), apps/api NestJS + Prisma + PostgreSQL, packages/shared; pembayaran Mayar via payment-link + webhook dengan PaymentProvider mock untuk mode tanpa API key; desain dibangun di kode (Tailwind v4) dengan referensi Dribbble; deploy Docker compose di VPS.
pending-action: user memberi "oke" eksplisit → tulis .omo/plans/coffein-ordering-site.md (skeleton + todo batches). next workflow action: high-accuracy review opsional (review_required=false) setelah plan dibuat.
