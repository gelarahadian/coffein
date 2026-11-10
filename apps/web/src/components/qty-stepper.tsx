"use client";

// Target sentuh 44px per tombol (DESIGN.md §5).
export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 50,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-line bg-surface">
      <button
        type="button"
        aria-label="Kurangi jumlah"
        className="flex h-11 w-11 items-center justify-center text-lg leading-none text-coffee-700 transition hover:text-coffee-900 disabled:cursor-not-allowed disabled:opacity-30"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-coffee-900">
        {value}
      </span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        className="flex h-11 w-11 items-center justify-center text-lg leading-none text-coffee-700 transition hover:text-coffee-900 disabled:cursor-not-allowed disabled:opacity-30"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
