"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !(dark ?? document.documentElement.classList.contains("dark"));
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    localStorage.setItem("local-lead-finder-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar modo escuro"
      className="inline-flex h-9 w-16 items-center rounded-lg border border-parchment bg-warm-cream p-1 transition hover:brightness-95 dark:border-white/10 dark:bg-[#1a1630]"
    >
      <span
        className={cn(
          "grid h-7 w-7 place-items-center rounded-md bg-white text-charcoal shadow-sm transition-transform dark:translate-x-7 dark:bg-mysteria dark:text-white",
          dark === null && "opacity-0"
        )}
      >
        {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
