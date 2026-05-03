import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  tone?: "lavender" | "cream" | "outline" | "green" | "yellow" | "red" | "blue";
  className?: string;
};

export function Badge({ children, tone = "outline", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-bold tracking-wide",
        tone === "lavender" && "bg-lavender text-mysteria",
        tone === "cream" && "bg-warm-cream text-charcoal",
        tone === "outline" && "border border-parchment bg-white text-charcoal dark:border-white/10 dark:bg-transparent dark:text-white",
        tone === "green" && "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
        tone === "yellow" && "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
        tone === "red" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
        tone === "blue" && "bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200",
        className
      )}
    >
      {children}
    </span>
  );
}
