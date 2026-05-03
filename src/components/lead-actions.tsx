"use client";

import { Check, Copy, Instagram, MapPinned, Search, Save } from "lucide-react";
import { useState } from "react";
import { fetchJson } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getGoogleSearchUrl, getInstagramSearchUrl, getMapUrl, getOutreachMessage } from "@/lib/outreach";
import type { Lead } from "@/types/lead";

export function LeadActions({ lead, onSaved }: { lead: Lead; onSaved?: (lead: Lead) => void }) {
  const [feedback, setFeedback] = useState<"saved" | "copied" | "error" | null>(null);

  function flash(next: typeof feedback) {
    setFeedback(next);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  async function saveLead() {
    try {
      const data = await fetchJson<{ lead: Lead }>("/api/leads", { method: "POST", body: JSON.stringify(lead) });
      onSaved?.(data.lead);
      flash("saved");
    } catch {
      flash("error");
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(getOutreachMessage(lead));
      flash("copied");
    } catch {
      flash("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <ActionButton
          active={feedback === "saved"}
          label={feedback === "saved" ? "Salvo" : "Salvar"}
          onClick={saveLead}
          icon={feedback === "saved" ? Check : Save}
        />
        <ActionButton
          active={feedback === "copied"}
          label={feedback === "copied" ? "Copiado" : "Copiar msg"}
          onClick={copyMessage}
          icon={feedback === "copied" ? Check : Copy}
          variant="secondary"
        />
      </div>

      <div className="flex items-center gap-2">
        <IconLink href={getGoogleSearchUrl(lead)} title="Buscar no Google" icon={Search} />
        <IconLink href={getInstagramSearchUrl(lead)} title="Buscar no Instagram" icon={Instagram} />
        <IconLink href={getMapUrl(lead)} title="Ver no OpenStreetMap" icon={MapPinned} />
      </div>

      {feedback === "error" && (
        <span className="text-xs font-semibold text-red-600 dark:text-red-300">Ação falhou. Tente novamente.</span>
      )}
    </div>
  );
}

type ActionButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  variant?: "primary" | "secondary";
};

function ActionButton({ icon: Icon, label, onClick, active, variant = "primary" }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40",
        variant === "primary" && (active ? "bg-emerald-600 text-white" : "bg-charcoal text-white hover:opacity-90"),
        variant === "secondary" && (active ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-warm-cream text-charcoal hover:brightness-95")
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function IconLink({ icon: Icon, title, href }: { icon: React.ComponentType<{ className?: string }>; title: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={title}
      aria-label={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-parchment bg-white text-charcoal transition hover:bg-stone-50 dark:border-white/10 dark:bg-[#1a1630] dark:text-stone-300 dark:hover:bg-white/5"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
