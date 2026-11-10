// Warna status sesuai DESIGN.md §2.2 (teks + background berpasangan, kontras AA).
const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning-soft text-warning",
  PAID: "bg-success-soft text-success",
  PREPARING: "bg-accent-soft text-accent",
  READY: "bg-info-soft text-info",
  COMPLETED: "bg-coffee-100 text-coffee-700",
  CANCELLED: "bg-danger-soft text-danger",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Dibayar",
  PREPARING: "Disiapkan",
  READY: "Siap Diambil",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-coffee-100 text-coffee-700";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
