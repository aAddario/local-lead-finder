import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "cream" | "dark" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ className, variant = "cream", size = "md", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40",
        size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-5 text-base",
        variant === "cream" && "bg-warm-cream text-charcoal hover:brightness-95",
        variant === "dark" && "bg-charcoal text-white hover:opacity-90",
        variant === "ghost" && "bg-transparent text-charcoal hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        "rounded-lg",
        className
      )}
      {...props}
    />
  );
}
