"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAdminToken, getAdminToken } from "@/lib/admin-api";

// Sidebar admin sesuai DESIGN.md §6.7: coffee-900, desktop w-56,
// mobile jadi top bar. Link aktif bg-white/15.
const NAV_ITEMS = [
  { href: "/admin", label: "Pesanan" },
  { href: "/admin/products", label: "Produk" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLogin && !getAdminToken()) {
      router.replace("/admin/login");
      return;
    }
    setChecked(true);
  }, [isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (!checked) {
    return (
      <div className="py-20 text-center text-sm text-coffee-100">
        Memeriksa sesi…
      </div>
    );
  }

  const handleLogout = () => {
    clearAdminToken();
    router.replace("/admin/login");
  };

  const navLinks = (
    <nav className="flex gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-4 py-2 text-sm font-medium transition duration-150 ${
              active
                ? "bg-white/15 text-white"
                : "text-coffee-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-surface md:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-56 shrink-0 flex-col justify-between bg-coffee-900 p-5 md:flex">
        <div>
          <Link
            href="/"
            className="font-display text-2xl font-bold text-white"
          >
            Coffein<span className="text-accent">.</span>
          </Link>
          <p className="mt-1 text-xs uppercase tracking-wide text-coffee-100">
            Panel Admin
          </p>
          <div className="mt-6">{navLinks}</div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md px-4 py-2 text-left text-sm font-medium text-coffee-100 transition duration-150 hover:bg-white/10 hover:text-white"
        >
          Keluar
        </button>
      </aside>

      {/* Top bar mobile */}
      <div className="flex items-center justify-between bg-coffee-900 px-4 py-3 md:hidden">
        <Link href="/" className="font-display text-xl font-bold text-white">
          Coffein<span className="text-accent">.</span>
        </Link>
        {navLinks}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar"
          className="rounded-md px-2 py-2 text-sm text-coffee-100 transition hover:bg-white/10 hover:text-white"
        >
          Keluar
        </button>
      </div>

      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
