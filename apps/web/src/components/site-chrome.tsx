"use client";

import { usePathname } from "next/navigation";

// Sembunyikan chrome storefront (header/footer) di panel admin —
// admin punya sidebar coffee-900 sendiri (DESIGN.md §6.7).
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
