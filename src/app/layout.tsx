import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BarChart3, KanbanSquare, Map, Search, Table2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Lead Finder",
  description: "MVP interno de prospecção local com OpenStreetMap."
};

const nav = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/leads", label: "Leads", icon: Table2 },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/kanban", label: "Kanban", icon: KanbanSquare }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='local-lead-finder-theme';var s=localStorage.getItem(k);var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`
          }}
        />
      </head>
      <body>
        <div className="min-h-screen bg-white dark:bg-[#0d0b1e]">
          <header className="sticky top-0 z-40 border-b border-parchment bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-[#0d0b1e]/90">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
              <Link href="/" className="flex items-center gap-3 no-underline">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-mysteria">
                  <Image src="/brand/local-lead-finder-logo.svg" width={36} height={36} alt="Logo Local Lead Finder" className="h-full w-full object-contain" priority />
                </span>
                <span>
                  <span className="block text-lg font-bold tracking-tight text-charcoal dark:text-white">Local Lead Finder</span>
                  <span className="block text-sm font-medium text-stone-500 dark:text-stone-400">Radar de prospecção OSM</span>
                </span>
              </Link>
              <div className="flex flex-wrap items-center gap-1">
                <nav className="flex flex-wrap items-center gap-1">
                  {nav.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold text-charcoal no-underline transition hover:bg-warm-cream dark:text-stone-300 dark:hover:bg-white/10"
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
