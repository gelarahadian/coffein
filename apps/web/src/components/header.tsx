import Link from "next/link";
import { CartLink } from "./cart-link";

// Navbar putih + logo coffee-900, blur hanya di navbar (aksen glass 1 elemen).
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-2xl font-bold text-coffee-900">
          Coffein<span className="text-accent">.</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-coffee-700">
          <Link href="/" className="hover:text-accent">
            Menu
          </Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
