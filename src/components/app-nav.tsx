"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Flag, KanbanSquare, Map, Search, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/leads", label: "Leads", icon: Table2 },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/kanban", label: "Kanban", icon: KanbanSquare },
  { href: "/campaigns", label: "Campanhas", icon: Flag }
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1" aria-label="Navegacao principal">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-base font-semibold no-underline transition",
              active
                ? "bg-charcoal text-white shadow-tight dark:bg-white dark:text-[#0d0b1e]"
                : "text-charcoal hover:bg-warm-cream dark:text-stone-300 dark:hover:bg-white/10"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
