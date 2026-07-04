"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardStateProvider } from "@/lib/dashboard-state-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/set-incentives", label: "Set Incentives", icon: "layers" },
  { href: "/your-numbers", label: "Your Numbers", icon: "activity" },
  { href: "/settings", label: "Settings", icon: "settings" }
] as const;

function ShellIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.25,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true
  };

  if (name === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="8" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="15" width="7" height="6" rx="1.5" />
      </svg>
    );
  }

  if (name === "layers") {
    return (
      <svg {...common}>
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      </svg>
    );
  }

  if (name === "activity") {
    return (
      <svg {...common}>
        <path d="M22 12h-4l-3 8L9 4l-3 8H2" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...common}>
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.07a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.07A1.7 1.7 0 0 0 4.6 8.4a1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 8.97 4.03 1.7 1.7 0 0 0 10 2.47V2a2 2 0 1 1 4 0v.47a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 8.4a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.07A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M3 3v18h18" />
      <path d="m7 16 4-8 4 4 4-6" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#fbfdfb] text-ink lg:flex">
      <aside className="border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-r">
        <div className="flex items-center gap-3 border-b border-line p-5 lg:p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-dark-teal text-white shadow-md">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
            </svg>
          </div>
          <Link href="/" className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-dark-teal">CareBearBooks</h1>
            <p className="text-[10px] font-normal uppercase tracking-widest text-slate-500">Financial Ops</p>
          </Link>
        </div>

        <nav className="flex gap-2 overflow-x-auto p-4 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-visible">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-dark-teal text-white shadow-sm"
                    : "text-slate-500 hover:bg-sage-soft hover:text-ink"
                ].join(" ")}
              >
                <ShellIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden border-t border-line bg-sage-soft/60 p-4 lg:block">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-dark-teal text-xs font-semibold text-white">
              AP
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ink">Arthur Pendelton</p>
              <p className="truncate text-[10px] text-slate-500">Chief Financial Officer</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <DashboardStateProvider>{children}</DashboardStateProvider>
      </main>
    </div>
  );
}
