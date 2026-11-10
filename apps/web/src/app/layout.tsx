import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SiteChrome } from "@/components/site-chrome";

// Fraunces (serif hangat) untuk judul/brand, Inter untuk isi/UI — DESIGN.md §4.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coffein",
  description: "Pesan kopi favoritmu dari Coffein Cafe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans">
        <div className="flex min-h-screen flex-col">
          <SiteChrome>
            <Header />
          </SiteChrome>
          <main className="flex-1">{children}</main>
          <SiteChrome>
            <Footer />
          </SiteChrome>
        </div>
      </body>
    </html>
  );
}
