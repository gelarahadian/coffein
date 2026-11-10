
## 2026-11-04 Task 1-3 (infra, shared, api)
- pnpm 11: setting build scripts = `allowBuilds:` map di pnpm-workspace.yaml (bukan pnpm.onlyBuiltDependencies di package.json). Sudah diizinkan: esbuild, prisma, @prisma/client, @prisma/engines, @swc/core.
- Port 5432 host dipakai postgres sistem → docker-compose.dev.yml memetakan postgres ke host port 5433. DATABASE_URL dev: postgresql://coffein:coffein@localhost:5433/coffein
- vitest/tsx (esbuild) TIDAK mendukung emitDecoratorMetadata → DI NestJS gagal (dependency undefined). Solusi: unplugin-swc + .swcrc (legacyDecorator + decoratorMetadata) di apps/api/vitest.config.ts.
- NestJS: `@UsePipes` handler-level berlaku ke SEMUA param (termasuk @Param) → pakai per-parameter pipe `@Body(new ZodValidationPipe(schema))`.
- express.json() strict mode menolak scalar JSON body → endpoint update status pakai object `{ status }`.
- @nestjs/jwt v11: expiresIn butuh tipe JwtSignOptions["expiresIn"], cast env string.
- e2e: DB test = coffein_test (dibuat + db push oleh test/global-setup.ts). 15/15 pass.
- API envelope: { success: true, data } | { success: false, error: { message } } via APP_INTERCEPTOR/APP_FILTER global.
- Seed: admin@coffein.id / admin12345 (env ADMIN_EMAIL/ADMIN_PASSWORD), 3 kategori, 6 produk.

## 2026-11-04 Task 4 (storefront)
- React context provider di root layout GAGAL saat prerender statis Next 15.5 (context null di page bundle) → solusi: module store + useSyncExternalStore (src/lib/cart-store.ts), tanpa provider. Server snapshot = array kosong stabil → bebas hydration mismatch.
- Halaman client yang bergantung state: tetap prerender aman dengan pola store.
- Alur terverifikasi via browser: menu → tambah keranjang → cart (persist localStorage) → checkout (nama+WA+dine-in) → POST /orders → redirect mock-pay → bayar → thanks → status PAID. Evidence: .omo/notepads/coffein-ordering-site/evidence/.
- TODO kecil: favicon 404 (tambahkan icon di app dir).

## 2026-11-04 Task 5: Admin Panel
- `next start` TIDAK kompatibel dengan `output: standalone` (warning + gagal serve). Standalone server juga gagal di lokal karena symlink pnpm (`Cannot find module './cpu-profile'`). Untuk QA lokal gunakan `pnpm dev`; standalone hanya untuk Docker (task 6, tangani node_modules di Dockerfile).
- `admin-api.ts` perlu import `apiPost` dari `./api` untuk login (build error pertama: `Cannot find name 'apiPost'`).
- Admin QA via Playwright MCP sukses: login admin@coffein.id → dashboard list pesanan (CF-ZUK1SHDA, CF-ZK86LRCH) → workflow PENDING→PAID→PREPARING→READY→COMPLETED via tombol aksi → CRUD produk (create "Es Kopi Susu Pandan" Rp 23.000 kategori Kopi, delete dengan confirm dialog) → kategori chips + tambah/hapus.
- Evidence: .omo/notepads/coffein-ordering-site/evidence/evidence-admin-products.png
- Pola admin pages: client component + `adminFetch` (Bearer dari cookie `coffein_admin_token`), polling 10s di dashboard pesanan, `NEXT_ACTIONS` map untuk tombol status berikutnya.

## 2026-11-04 Task 6: Docker Deploy
- `prisma` + `tsx` dipindah ke dependencies api (dibutuhkan runtime: migrate deploy + seed di container); lockfile diupdate via pnpm install.
- `pnpm deploy --legacy /out/api` memangkas node_modules TAPI membuang Prisma client tergenerate → runner WAJIB `npx prisma generate` ulang setelah COPY.
- pnpm isolated linker (default) membuat standalone Next berisi symlink rusak di container → set `node-linker=hoisted` via .npmrc di stage deps Dockerfile (Docker-only, lokal tetap isolated).
- `outputFileTracingRoot` HARUS root monorepo (`path.join(__dirname, "../../")`), bukan `__dirname` (apps/web) — kalau apps/web, tracer mengecualikan node_modules hoisted di root → standalone tanpa `next`.
- Dengan tracing root monorepo, struktur standalone berubah: `server.js` di `.next/standalone/apps/web/server.js` → runner CMD `node apps/web/server.js`, static ke `./apps/web/.next/static`.
- `docker compose` commands butuh `JWT_SECRET` env karena compose pakai `${JWT_SECRET:?...}` (required) — tanpa itu command gagal diam-diam.
- Smoke test produksi sukses: health ok, products list, admin login, order create CF-0Q9KTGSZ → mock pay → PAID.
- File: apps/api/Dockerfile + docker-entrypoint.sh, apps/web/Dockerfile, docker-compose.yml, .dockerignore, .env.example, README.md (env docs).

## 2026-11-04 Task 7: QA & Polish
- Added vitest to apps/web (config with @ alias). Guard tests: formatRupiah (note: Intl "id-ID" currency uses U+00A0 non-breaking space after "Rp", not regular space — caused initial test failures), cart-store mutations (asserted via fake localStorage since persist() writes to window.localStorage).
- Fixed favicon 404 by adding src/app/icon.svg (coffee cup, matches design tokens) — serves at /favicon.ico via Next metadata routing.
- Final test run: shared 12/12, web 9/9, api e2e 15/15, pnpm -r build clean.
- Grep audit: no TODO/FIXME/HACK/stubs/as any/@ts-ignore in apps/.

## 2026-11-04 Task 7: QA & Polish
- Added vitest to apps/web (node env, @ alias). Guard tests: formatRupiah (NOTE: Intl "id-ID" currency uses U+00A0 non-breaking space after "Rp" — literal space in expected string fails) and cart-store mutations (asserted via fake localStorage injected on globalThis.window; persist() swallows ReferenceError in node env).
- Fixed favicon 404 with src/app/icon.svg — Next serves /icon.svg + injects <link rel="icon"> in head (verified 200 + link tag present).
- Final test run: shared 12/12, web 9/9, api e2e 15/15, pnpm -r build clean.
- Grep audit: no TODO/FIXME/HACK/stubs/as any/@ts-ignore in apps/ (only "CF-XXXX" test fixture string, false positive).

## 2026-11-04 Task 7 + Final Wave: COMPLETE
- Added vitest to apps/web (node env, @ alias) with guard tests: formatRupiah (Intl "id-ID" currency uses U+00A0 non-breaking space after "Rp" — literal space fails) and cart-store mutations (fake localStorage injected on globalThis.window; persist() swallows ReferenceError in node).
- Fixed favicon 404 with src/app/icon.svg — Next serves /icon.svg + injects <link rel="icon"> (verified 200 + link tag).
- Final test totals: shared 12/12, web 9/9, api e2e 15/15; pnpm -r build clean.
- Grep audit: zero TODO/FIXME/HACK/stubs/as any/@ts-ignore in apps/.
- Final Wave verdicts (self-reviewed, user forbade subagents): F1 APPROVE (scope honored), F2 APPROVE (clean audit, tsc clean), F3 APPROVE (guards+Zod+Prisma+required JWT_SECRET), F4 APPROVE (Docker stack end-to-end: order CF-FCG20ZKM → PAID → PREPARING → READY → COMPLETED; pages 200).

## 2026-11-10 Antislop redesign (DESIGN.md basis)
- DESCOVERY KRITIS: kelas lama (cream/espresso/latte/caramel/foam/muted/font-display) KHÔNG từng được định nghĩa trong globals.css và không font nào được nạp → toàn bộ trang bị hỏng kiểu dáng. Mọi class cũ phải được ánh xạ sang token mới theo DESIGN.md §3.
- globals.css: viết lại toàn bộ @theme (surface #FBF8F4, line #EDE4DA, coffee-900 #3B2218 / 700 #5C3A28 / 500 #8A5A3C / 300 #C4A484 / 100 #F1E6DA, accent #B8531C, status warning/success/info/danger + soft, radius 8/12/20, shadow-card, font-display/sans) + base layer (cursor, focus-visible accent outline, prefers-reduced-motion).
- layout.tsx: Fraunces (display) + Inter qua next/font/google với CSS var; body font-sans.
- layout.tsx: Header/Footer bọc trong SiteChrome (client component) để ẨN chrome storefront trên rute /admin (admin có sidebar coffee-900 riêng §6.7).
- R-02: footer.tsx em dash "Coffein Cafe — ..." đã sửa thành hai chấm ":" (không dùng em dash trong copy user-facing).
- R-03: target chạm ≥44px (QtyStepper nút h-11 w-11). R-40: img có width/height/loading="lazy" (non-hero). R-10: backdrop-blur tối đa 1 phần tử (navbar).
- Màu status theo §2.2 (cặp bg-soft/text): PENDING warning, PAID success, PREPARING accent, READY info, COMPLETED coffee-100/700, CANCELLED danger.
- Chip filter §6.4: bg-coffee-100 mặc định, bg-coffee-900 text-white khi active.
- Cart bar mobile §6.3: fixed bottom, border-t line, backdrop-blur, chỉ hiển thị khi count>0.
- Stepper order §6.6: done=coffee-700, active=accent, next=coffee-300; polling 5s khi PENDING/PAID/PREPARING.
- Sidebar admin §6.7: coffee-900, desktop w-56, mobile top bar; link active bg-white/15.
- Contrast đã tính: coffee-700 ~8.5:1, coffee-500 ~5.8:1 (AA), accent #B8531C trắng ~4.9:1 (AA); coffee-300 KHÔNG dùng làm chữ (chỉ border).
- next/font/google yêu cầu mạng khi build; nếu offline → fallback font stack Georgia/system-ui.
- Build + test sau redesign: pnpm --filter web build OK, web 9/9, shared 12/12.
- QA browser (Playwright, viewport 360px): menu/cart/checkout/mock-pay/thanks/order-status/admin-login/admin-orders/admin-products đều render đúng, workflow status PENDING→Disiapkan OK, 0 lỗi console. Bằng chứng ảnh: .omo/notepads/coffein-ordering-site/evidence/qa-redesign-menu-mobile.png, qa-redesign-admin.png, qa-redesign-admin-products.png.
- look_at (phân tích ảnh) không ổn định (timeout lặp) → dựa vào snapshot truy cập tính + computed styles (Fraunces/Inter đã nạp, h1 #3B2218, nút accent #B8531C trắng) thay vì xem pixel.
