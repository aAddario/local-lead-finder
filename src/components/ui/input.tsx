import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-parchment bg-white px-4 text-base text-charcoal outline-none transition placeholder:text-stone-400 focus:border-charcoal focus:ring-2 focus:ring-lavender/30 dark:border-white/10 dark:bg-[#1a1630] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-white/30",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-lg border border-parchment bg-white px-4 py-3 text-base text-charcoal outline-none transition placeholder:text-stone-400 focus:border-charcoal focus:ring-2 focus:ring-lavender/30 dark:border-white/10 dark:bg-[#1a1630] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-white/30",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-parchment bg-white px-4 text-base text-charcoal outline-none transition focus:border-charcoal focus:ring-2 focus:ring-lavender/30 dark:border-white/10 dark:bg-[#1a1630] dark:text-white dark:focus:border-white/30",
        props.className
      )}
    />
  );
}
