"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarClock, CopyCheck, Flag, History, KanbanSquare, Map, Search, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/search", label: "Buscar", icon: Search },
  { href: "/searches", label: "Buscas", icon: History },
  { href: "/leads", label: "Leads", icon: Table2 },
  { href: "/followups", label: "Follow-ups", icon: CalendarClock },
  { href: "/duplicates", label: "Duplicados", icon: CopyCheck },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/kanban", label: "Kanban", icon: KanbanSquare },
  { href: "/campaigns", label: "Campanhas", icon: Flag }
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className="no-scrollbar flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border border-parchment/80 bg-white/70 p-1 shadow-tight dark:border-white/10 dark:bg-white/5"
      aria-label="Navegacao principal"
    >
      {nav.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold no-underline transition md:px-3 md:text-sm",
              active
                ? "bg-charcoal text-white shadow-tight dark:bg-white dark:text-[#0d0b1e]"
                : "text-charcoal hover:bg-warm-cream dark:text-stone-300 dark:hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden whitespace-nowrap sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
