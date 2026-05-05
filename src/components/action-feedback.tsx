import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionFeedbackProps = {
  message: string | null;
  tone?: "success" | "error" | "info";
  className?: string;
};

export function ActionFeedback({ message, tone = "success", className }: ActionFeedbackProps) {
  if (!message) return null;

  const Icon = tone === "error" ? AlertCircle : tone === "info" ? Info : CheckCircle2;

  return (
    <span
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-tight",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200",
        tone === "error" && "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200",
        tone === "info" && "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-200",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {message}
    </span>
  );
}
