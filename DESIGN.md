# DESIGN.md — Coffein

Panduan desain untuk web pemesanan kafe **Coffein** (`apps/web`: storefront pelanggan + `/admin`).
Dokumen ini jadi acuan tunggal untuk developer dan agen AI agar tampilan konsisten.

---

## 1. Prinsip Desain

1. **Bersih & hangat** — dasar putih, terasa lega seperti kafe yang terang; sentuhan cokelat memberi rasa hangat.
2. **Cepat dipesan** — pelanggan (guest, kebanyakan dari HP) harus bisa pilih menu → bayar dalam beberapa tap.
3. **Mobile-first** — storefront dirancang untuk layar 360–430px dulu, baru desktop.
4. **Aksen hanya untuk aksi** — warna aksen dipakai sangat hemat supaya tombol penting langsung terlihat.
5. **Aksesibel** — kontras teks minimal WCAG AA (4.5:1).

---

## 2. Aturan Warna 60 : 30 : 10

| Porsi   | Peran    | Warna                         | Dipakai untuk                                                  |
| ------- | -------- | ----------------------------- | -------------------------------------------------------------- |
| **60%** | Dasar    | Putih                         | Background halaman, kartu produk, form, modal                  |
| **30%** | Sekunder | Cokelat kopi                  | Header/navbar, footer, judul, teks, ikon, border, banner       |
| **10%** | Aksen    | Terracotta (karamel terbakar) | Tombol CTA, badge harga/promo, link aktif, indikator keranjang |

### 2.1 Palet Lengkap

**Dasar — Putih (60%)**

| Token             | Hex       | Pemakaian                                                            |
| ----------------- | --------- | -------------------------------------------------------------------- |
| `--color-white`   | `#FFFFFF` | Background utama                                                     |
| `--color-surface` | `#FBF8F4` | Section selang-seling, area input, kartu tersier (krem sangat tipis) |
| `--color-line`    | `#EDE4DA` | Garis pemisah, border kartu                                          |

**Kopi (30%)**

| Token                | Hex       | Pemakaian                                           |
| -------------------- | --------- | --------------------------------------------------- |
| `--color-coffee-900` | `#3B2218` | Teks judul, navbar gelap, footer (espresso)         |
| `--color-coffee-700` | `#5C3A28` | Teks isi, ikon, tombol sekunder                     |
| `--color-coffee-500` | `#8A5A3C` | Hover tombol sekunder, ilustrasi                    |
| `--color-coffee-300` | `#C4A484` | Border aktif, placeholder, ikon nonaktif (latte)    |
| `--color-coffee-100` | `#F1E6DA` | Background chip/kategori, hover baris (milk coffee) |

**Aksen (10%) — Terracotta**

| Token                  | Hex       | Pemakaian                                |
| ---------------------- | --------- | ---------------------------------------- |
| `--color-accent`       | `#B8531C` | Tombol utama (Tambah, Checkout, Bayar)   |
| `--color-accent-hover` | `#9C4416` | Hover / pressed                          |
| `--color-accent-soft`  | `#FBEBDD` | Background badge promo, highlight ringan |

> **Kenapa terracotta?** Aksen harus kontras dengan cokelat, bukan senada. Terracotta tetap sehubungan dengan kopi (karamel/kayu manis), terlihat jelas di atas putih, dan teks putih di atasnya lolos kontras AA (±4.9:1). Alternatif bila ingin nuansa lebih segar: **hijau daun** `#3F7D58` (rasa matcha/fresh).

### 2.2 Warna Status (fungsional, di luar porsi 60:30:10)

Dipakai hanya untuk badge status pesanan dan notifikasi, ukurannya kecil.

| Status              | Token   | Hex (teks) | Hex (background) |
| ------------------- | ------- | ---------- | ---------------- |
| `PENDING`           | warning | `#8A5A00`  | `#FFF3D6`        |
| `PAID`              | success | `#2F6B3F`  | `#E3F3E7`        |
| `PREPARING`         | accent  | `#B8531C`  | `#FBEBDD`        |
| `READY`             | info    | `#1F5F7A`  | `#E0F0F6`        |
| `COMPLETED`         | neutral | `#5C3A28`  | `#F1E6DA`        |
| `CANCELLED` / error | danger  | `#A32A2A`  | `#FBE4E4`        |

### 2.3 Aturan Pemakaian

- Maksimal **satu tombol aksen per layar/viewport** sebagai aksi utama.
- Teks di atas background putih: `coffee-900` (judul) / `coffee-700` (isi). Hindari abu-abu murni.
- Teks di atas `coffee-900`: putih atau `coffee-100`.
- Teks putih hanya di atas `accent` / `accent-hover` / `coffee-700` ke atas (gelap).
- Jangan pakai aksen untuk teks paragraf atau dekorasi besar.

---

## 3. Design Tokens (Tailwind / CSS)

```css
/* apps/web/src/app/globals.css */
:root {
  --color-white: #ffffff;
  --color-surface: #fbf8f4;
  --color-line: #ede4da;

  --color-coffee-900: #3b2218;
  --color-coffee-700: #5c3a28;
  --color-coffee-500: #8a5a3c;
  --color-coffee-300: #c4a484;
  --color-coffee-100: #f1e6da;

  --color-accent: #b8531c;
  --color-accent-hover: #9c4416;
  --color-accent-soft: #fbebdd;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;

  --shadow-card: 0 1px 2px rgb(59 34 24 / 6%), 0 4px 12px rgb(59 34 24 / 6%);
}
```

```ts
// tailwind.config.ts (extend)
colors: {
  surface: "#FBF8F4",
  line: "#EDE4DA",
  coffee: {
    900: "#3B2218",
    700: "#5C3A28",
    500: "#8A5A3C",
    300: "#C4A484",
    100: "#F1E6DA",
  },
  accent: {
    DEFAULT: "#B8531C",
    hover: "#9C4416",
    soft: "#FBEBDD",
  },
},
```

---

## 4. Tipografi

| Peran         | Font                                 | Catatan                                                  |
| ------------- | ------------------------------------ | -------------------------------------------------------- |
| Judul / brand | **Fraunces** (serif, hangat)         | Dipakai di logo, hero, nama section                      |
| Isi / UI      | **Inter** atau **Plus Jakarta Sans** | Terbaca di layar kecil, mendukung angka rapi untuk harga |

Fallback: `Georgia, serif` dan `system-ui, sans-serif`. Muat lewat `next/font`.

| Level   | Ukuran (mobile → desktop) | Berat       |
| ------- | ------------------------- | ----------- |
| H1      | 28 → 40px                 | 700 (serif) |
| H2      | 22 → 30px                 | 700 (serif) |
| H3      | 18 → 22px                 | 600         |
| Body    | 15–16px                   | 400         |
| Caption | 13px                      | 400         |
| Harga   | 16–18px, `tabular-nums`   | 600         |

---

## 5. Spacing, Radius, Elevasi

- Skala spacing 4px: `4, 8, 12, 16, 24, 32, 48, 64`.
- Padding halaman mobile `16px`, desktop container maks `1120px`.
- Radius: input & tombol `12px`, kartu `16–20px`, chip `999px`.
- Bayangan lembut (`--shadow-card`), hindari bayangan hitam pekat.
- Target sentuh minimal **44×44px**.

---

## 6. Komponen

### 6.1 Tombol

| Varian    | Background                  | Teks         | Dipakai                              |
| --------- | --------------------------- | ------------ | ------------------------------------ |
| Primary   | `accent`                    | putih        | Tambah ke keranjang, Checkout, Bayar |
| Secondary | putih + border `coffee-300` | `coffee-700` | Lihat detail, Kembali                |
| Ghost     | transparan                  | `coffee-700` | Aksi tersier, Batal                  |
| Danger    | `#A32A2A`                   | putih        | Batalkan pesanan (admin)             |

State: hover (`accent-hover`), focus (ring 2px `accent` offset 2px), disabled (opacity 50%), loading (spinner + teks tetap).

### 6.2 Kartu Produk (Menu)

- Foto 4:3, sudut atas membulat, background putih, border `line`.
- Nama (`coffee-900`, 600), deskripsi 1–2 baris (`coffee-700`), harga di kiri bawah, tombol **+** (accent) di kanan bawah.
- Produk habis: foto grayscale + badge "Habis", tombol nonaktif.

### 6.3 Navbar & Keranjang

- Navbar putih dengan logo `coffee-900`; bisa transparan di hero.
- Ikon keranjang `coffee-700`, badge jumlah item berwarna `accent`.
- Mobile: bar keranjang melayang di bawah (sticky) berisi total + tombol "Checkout" (accent).

### 6.4 Chip Kategori

- Default: background `coffee-100`, teks `coffee-700`.
- Aktif: background `coffee-900`, teks putih.

### 6.5 Form Checkout (guest)

- Field: **Nama**, **No. WhatsApp**, pilihan **Takeaway / Dine-in** (segmented control; aktif = `coffee-900`).
- Input: background `surface`, border `line`, focus border `accent`; error border `danger` + pesan di bawah.
- Ringkasan pesanan di atas tombol "Bayar" (accent) yang full-width di mobile.

### 6.6 Halaman Status Pesanan

- Stepper horizontal: `Dibayar → Disiapkan → Siap → Selesai`; langkah selesai = `coffee-700`, langkah aktif = `accent`, berikutnya = `coffee-300`.
- Saat `PENDING`: tampilkan spinner halus + teks "Menunggu pembayaran…" (polling `GET /api/orders/:orderRef`).
- Saat `PAID`: ikon centang hijau (success), kode pesanan besar.

### 6.7 Admin (`/admin`)

- Layout sidebar `coffee-900` + konten putih; tabel dengan header `coffee-100`.
- Badge status mengikuti tabel §2.2.
- Tombol aksi status ("Proses", "Siap", "Selesai") memakai Primary; "Batalkan" memakai Danger.
- Alur status: `PENDING → PAID → PREPARING → READY → COMPLETED`, `CANCELLED` dari `PENDING/PAID`.

---

## 7. Layout per Halaman

| Halaman            | Struktur                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Beranda / Menu** | Hero singkat (putih + ilustrasi kopi) → chip kategori → grid produk (2 kolom mobile, 3–4 desktop) |
| **Detail Produk**  | Foto besar, pilihan varian (radio chip), catatan, qty stepper, tombol Tambah (accent)             |
| **Keranjang**      | Daftar item, qty stepper, subtotal, tombol Checkout                                               |
| **Checkout**       | Form guest + ringkasan → redirect ke halaman bayar Mayar                                          |
| **Status Pesanan** | Kode pesanan, stepper status, detail item                                                         |
| **Admin: Pesanan** | Tabel/kanban per status, filter tanggal, ubah status                                              |
| **Admin: Produk**  | CRUD produk + varian, toggle tersedia                                                             |

---

## 8. Ikon, Gambar, Motion

- Ikon: **Lucide** (stroke 1.75px), warna `coffee-700`.
- Foto produk: cahaya alami, background netral/kayu terang, rasio 4:3, WebP, `next/image`.
- Ilustrasi: garis sederhana warna cokelat, hindari warna di luar palet.
- Motion: transisi `150–200ms ease-out`; tombol tambah → animasi kecil (scale 0.96); hormati `prefers-reduced-motion`.

---

## 9. Aksesibilitas

- Kontras: `coffee-900/700` di atas putih ≥ 7:1; putih di atas `accent` ≈ 4.9:1.
- Fokus keyboard selalu terlihat (ring `accent`).
- Status tidak hanya dengan warna — sertakan ikon/teks.
- Label form eksplisit; `aria-live="polite"` untuk perubahan status pesanan.
- Dukungan layar kecil hingga 320px.

---

## 10. Tone & Copywriting

- Bahasa Indonesia, santai tapi sopan ("Pesan sekarang", "Menunggu pembayaran", "Pesananmu sedang dibuat").
- Tombol berupa kata kerja singkat: **Tambah**, **Checkout**, **Bayar**, **Lacak Pesanan**.
- Harga format `Rp 25.000`.

---

## 11. Checklist untuk Developer / Agen

- [ ] Latar halaman putih/`surface`, bukan cokelat (jaga porsi 60%).
- [ ] Cokelat hanya di header/footer, teks, border, chip aktif (±30%).
- [ ] Terracotta hanya di CTA/badge penting (±10%).
- [ ] Satu CTA utama per layar.
- [ ] Semua token diambil dari §3, tidak hard-code hex di komponen.
- [ ] Sudah dites di lebar 360px.
- [ ] Kontras teks lolos AA.
