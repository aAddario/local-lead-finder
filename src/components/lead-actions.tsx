"use client";

import { Check, Copy, ExternalLink, Facebook, Instagram, MapPinned, MessageCircle, Search, Save, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { fetchJson } from "@/lib/api";
import { cn } from "@/lib/utils";
import { generateLeadProposal } from "@/lib/proposal";
import { getFacebookSearchUrl, getGoogleSearchUrl, getInstagramSearchUrl, getMapUrl, getOutreachMessage, getWhatsAppUrl, type MessageTone } from "@/lib/outreach";
import type { ContactChannel, Lead, LeadStatus, WebsiteStatus } from "@/types/lead";

type LeadActionsProps = {
  lead: Lead;
  onSaved?: (lead: Lead) => void;
  layout?: "stacked" | "inline";
};

type Feedback = "saved" | "copied" | "updated" | "analyzed" | "error" | null;

export function LeadActions({ lead, onSaved, layout = "stacked" }: LeadActionsProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const whatsappUrl = getWhatsAppUrl(lead);

  function flash(next: Feedback) {
    setFeedback(next);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  async function saveLead() {
    try {
      setBusy(true);
      const data = await fetchJson<{ lead: Lead }>("/api/leads", { method: "POST", body: JSON.stringify(lead) });
      onSaved?.(data.lead);
      flash("saved");
    } catch {
      flash("error");
    } finally {
      setBusy(false);
    }
  }

  async function patchLead(patch: Partial<Lead>) {
    setBusy(true);
    try {
      await fetchJson<{ lead: Lead }>("/api/leads", { method: "POST", body: JSON.stringify(lead) });
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      onSaved?.(data.lead);
      flash("updated");
    } catch {
      flash("error");
    } finally {
      setBusy(false);
    }
  }

  async function copyMessage(tone: MessageTone) {
    await copyText(getOutreachMessage(lead, tone));
  }

  async function copyProposal() {
    await copyText(generateLeadProposal(lead).text);
  }

  async function copyText(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        copyTextFallback(text);
      }
      flash("copied");
    } catch {
      try {
        copyTextFallback(text);
        flash("copied");
      } catch {
        flash("error");
      }
    }
  }

  async function markWebsite(status: WebsiteStatus) {
    const now = new Date().toISOString();
    await patchLead({
      websiteStatus: status,
      hasVerifiedWebsite: true,
      validationStatus: "verified",
      status: "Verificado",
      lastCheckedAt: now
    });
  }

  async function markGoodLead() {
    await patchLead({
      validationStatus: "verified",
      status: "Verificado",
      lastCheckedAt: new Date().toISOString()
    });
  }

  async function discardLead() {
    await patchLead({
      validationStatus: "discarded",
      status: "Descartado",
      lastCheckedAt: new Date().toISOString()
    });
  }

  async function registerContact(channel: ContactChannel, status: LeadStatus = "Contato enviado") {
    const now = new Date().toISOString();
    await patchLead({
      status,
      firstContactAt: lead.firstContactAt ?? now,
      lastContactAt: now,
      contactChannel: channel,
      contactHistory: [
        ...lead.contactHistory,
        { id: crypto.randomUUID(), at: now, channel, note: `Contato registrado via ${channel}` }
      ]
    });
  }

  async function analyzeSite() {
    if (!lead.website) return;
    try {
      setBusy(true);
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}/analyze-site`, { method: "POST" });
      onSaved?.(data.lead);
      flash("analyzed");
    } catch {
      flash("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={layout === "inline" ? "flex w-full flex-wrap items-center gap-2" : "flex flex-col gap-2"}>
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton active={feedback === "saved"} label={feedback === "saved" ? "Salvo" : "Salvar"} onClick={saveLead} icon={feedback === "saved" ? Check : Save} disabled={busy} />
        <ActionButton active={feedback === "copied"} label="Msg curta" onClick={() => copyMessage("short")} icon={Copy} variant="secondary" disabled={busy} />
        <ActionButton active={feedback === "copied"} label="Prof." onClick={() => copyMessage("professional")} icon={Copy} variant="secondary" disabled={busy} />
        <ActionButton active={feedback === "copied"} label="Informal" onClick={() => copyMessage("informal")} icon={Copy} variant="secondary" disabled={busy} />
        <ActionButton active={feedback === "copied"} label="Personal." onClick={() => copyMessage("personalized")} icon={Sparkles} variant="secondary" disabled={busy} />
        <ActionButton active={feedback === "copied"} label="Proposta" onClick={copyProposal} icon={Copy} variant="secondary" disabled={busy} />
        {lead.website && <ActionButton active={feedback === "analyzed"} label={feedback === "analyzed" ? "Analisado" : "Analisar site"} onClick={analyzeSite} icon={Sparkles} variant="secondary" disabled={busy} />}
      </div>

      <div className={layout === "inline" ? "ml-auto flex flex-wrap items-center gap-2" : "flex flex-wrap items-center gap-2"}>
        <IconLink href={getGoogleSearchUrl(lead)} title="Buscar no Google" icon={Search} onClick={() => patchLead({ lastCheckedAt: new Date().toISOString() })} />
        <IconLink href={getInstagramSearchUrl(lead)} title="Buscar no Instagram" icon={Instagram} />
        <IconLink href={getFacebookSearchUrl(lead)} title="Buscar no Facebook" icon={Facebook} />
        {whatsappUrl && <IconLink href={whatsappUrl} title="Abrir WhatsApp" icon={MessageCircle} onClick={() => registerContact("WhatsApp")} />}
        <IconLink href={getMapUrl(lead)} title="Ver no OpenStreetMap" icon={MapPinned} />
      </div>

      <div className="flex w-full flex-wrap items-center gap-2">
        <MiniButton label="Tem site" onClick={() => markWebsite("has_website")} disabled={busy} />
        <MiniButton label="Site ruim" onClick={() => markWebsite("bad_website")} disabled={busy} />
        <MiniButton label="Sem site confirmado" onClick={() => markWebsite("no_website")} disabled={busy} />
        <MiniButton label="Bom lead" onClick={markGoodLead} disabled={busy} />
        <MiniButton label="Descartar" onClick={discardLead} icon={Trash2} danger disabled={busy} />
      </div>

      {feedback && feedback !== "error" && (
        <span className="w-full text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {feedback === "copied" ? "Copiado." : feedback === "analyzed" ? "Site analisado." : feedback === "updated" ? "Lead atualizado." : "Lead salvo."}
        </span>
      )}
      {feedback === "error" && (
        <span className="w-full text-xs font-semibold text-red-600 dark:text-red-300">Ação falhou. Tente novamente.</span>
      )}
    </div>
  );
}

function copyTextFallback(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) throw new Error("Clipboard fallback failed");
}

type ActionButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

function ActionButton({ icon: Icon, label, onClick, active, variant = "primary", disabled }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && (active ? "bg-emerald-600 text-white" : "bg-charcoal text-white hover:opacity-90"),
        variant === "secondary" && (active ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-warm-cream text-charcoal hover:brightness-95")
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function MiniButton({ label, onClick, icon: Icon = Check, danger, disabled }: { label: string; onClick: () => void; icon?: React.ComponentType<{ className?: string }>; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        danger
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
          : "border-parchment bg-white text-charcoal hover:bg-stone-50 dark:border-white/10 dark:bg-[#1a1630] dark:text-stone-300 dark:hover:bg-white/5"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function IconLink({ icon: Icon, title, href, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; href: string; onClick?: () => void }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-parchment bg-white text-charcoal transition hover:bg-stone-50 dark:border-white/10 dark:bg-[#1a1630] dark:text-stone-300 dark:hover:bg-white/5"
    >
      <Icon className="h-4 w-4" />
      <ExternalLink className="sr-only" />
    </a>
  );
}
