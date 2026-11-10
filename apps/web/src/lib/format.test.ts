import { describe, expect, it } from "vitest";
import { formatRupiah } from "./format";

// Intl.NumberFormat("id-ID") memakai non-breaking space (U+00A0) setelah "Rp".
const NBSP = "\u00A0";

describe("formatRupiah (guard format uang FE)", () => {
  it("memformat rupiah id-ID tanpa desimal", () => {
    expect(formatRupiah(47000)).toBe(`Rp${NBSP}47.000`);
  });

  it("nol", () => {
    expect(formatRupiah(0)).toBe(`Rp${NBSP}0`);
  });

  it("harga jutaan", () => {
    expect(formatRupiah(1250000)).toBe(`Rp${NBSP}1.250.000`);
  });

  it("pemisah ribuan titik (guard tanda baca lokal)", () => {
    expect(formatRupiah(47000).replace(/[^\d.]/g, "")).toBe("47.000");
  });
});
