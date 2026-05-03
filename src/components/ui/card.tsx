import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-[#12101f] border border-parchment dark:border-white/10 rounded-2xl p-5",
        className
      )}
      {...props}
    />
  );
}
