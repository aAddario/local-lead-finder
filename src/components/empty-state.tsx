import { SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Card className="flex min-h-52 flex-col items-center justify-center text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-warm-cream">
        <SearchX className="h-6 w-6 text-charcoal" />
      </span>
      <h2 className="text-xl font-bold tracking-tight text-charcoal dark:text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-stone-500 dark:text-stone-400">{text}</p>
    </Card>
  );
}
