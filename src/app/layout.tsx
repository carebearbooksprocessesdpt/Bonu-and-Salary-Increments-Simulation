import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "CareBearBooks Bonus and Salary Increments Simulation",
  description: "Standalone CareBearBooks incentive planning and salary increment simulation model."
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/set-incentives", label: "Set Incentives" },
  { href: "/incentive-simulation", label: "Incentive Simulation" }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="shell">
          <header className="app-nav sticky top-0 z-40">
            <div className="app-container flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal">CareBearBooks</p>
                <h1 className="text-xl font-black leading-tight text-ink">
                  CareBearBooks Bonus and Salary Increments Simulation
                </h1>
              </Link>
              <NavLinks items={navItems} />
            </div>
          </header>
          <main className="app-container py-6 lg:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
