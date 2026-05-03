"use client";

import { Check, Copy, Instagram, MapPinned, Search, Save, ExternalLink } from "lucide-react";
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
    <div className="flex w-[280px] flex-col gap-2">
      <div className="flex items-center gap-2">
        <ActionButton
          kind="primary"
          label={feedback === "saved" ? "Salvo" : "Salvar lead"}
          title="Salvar lead no banco de dados"
          onClick={saveLead}
          icon={feedback === "saved" ? Check : Save}
          className="flex-1"
        />
        <ActionButton
          kind="secondary"
          label={feedback === "copied" ? "Copiado" : "Copiar mensagem"}
          title="Copiar mensagem de abordagem"
          onClick={copyMessage}
          icon={feedback === "copied" ? Check : Copy}
          className="flex-1"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <ActionLink label="Google" title="Buscar no Google" href={getGoogleSearchUrl(lead)} icon={Search} />
        <ActionLink label="Instagram" title="Buscar no Instagram" href={getInstagramSearchUrl(lead)} icon={Instagram} />
        <ActionLink label="Mapa" title="Ver no OpenStreetMap" href={getMapUrl(lead)} icon={MapPinned} />
      </div>

      {feedback === "error" && (
        <span className="text-xs font-semibold text-red-600 dark:text-red-300">Ação falhou. Tente novamente.</span>
      )}
    </div>
  );
}

type ActionProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
};

function ActionButton({
  icon: Icon,
  label,
  title,
  kind,
  onClick,
  className
}: ActionProps & { kind: "primary" | "secondary"; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40",
        kind === "primary" && "bg-charcoal text-white hover:opacity-90",
        kind === "secondary" && "bg-warm-cream text-charcoal hover:brightness-95",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ActionLink({ icon: Icon, label, title, href }: ActionProps & { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={title}
      aria-label={title}
      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-parchment bg-white px-2 text-[11px] font-semibold text-charcoal transition hover:bg-stone-50 dark:border-white/10 dark:bg-[#1a1630] dark:text-stone-300 dark:hover:bg-white/5"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
      <ExternalLink className="ml-auto h-3 w-3 shrink-0 opacity-40" />
    </a>
  );
}
