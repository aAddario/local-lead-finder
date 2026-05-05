"use client";

import { Bot, Check, ChevronDown, Copy, ExternalLink, Facebook, FileText, Instagram, MapPinned, MessageCircle, Search, Save, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionFeedback } from "@/components/action-feedback";
import { fetchJson } from "@/lib/api";
import { cn } from "@/lib/utils";
import { generateLeadProposal } from "@/lib/proposal";
import { getFacebookSearchUrl, getGoogleSearchUrl, getInstagramSearchUrl, getMapUrl, getOutreachMessage, getWhatsAppUrl, type MessageTone } from "@/lib/outreach";
import type { ContactChannel, Lead, LeadStatus, WebsiteStatus } from "@/types/lead";

type LeadActionsProps = {
  lead: Lead;
  onSaved?: (lead: Lead) => void;
  onOptimisticSave?: (lead: Lead) => void;
  onSaveFailed?: (lead: Lead) => void;
  layout?: "stacked" | "inline";
  persisted?: boolean;
};

type Feedback = "saved" | "copied" | "generated" | "updated" | "analyzed" | "error" | null;

const toneLabels: Record<MessageTone, string> = {
  short: "Curta",
  professional: "Prof.",
  informal: "Informal",
  personalized: "Local"
};

export function LeadActions({ lead, onSaved, onOptimisticSave, onSaveFailed, layout = "stacked", persisted = false }: LeadActionsProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const [savedLead, setSavedLead] = useState<Lead | null>(persisted ? lead : null);
  const [messageTone, setMessageTone] = useState<MessageTone>("professional");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const activeLead = savedLead ?? lead;
  const isSaved = persisted || Boolean(savedLead);
  const whatsappUrl = getWhatsAppUrl(activeLead);

  useEffect(() => {
    setSavedLead(persisted ? lead : null);
  }, [lead, persisted]);

  function flash(next: Feedback) {
    setFeedback(next);
    window.setTimeout(() => setFeedback(null), 1800);
  }

  async function persistLead() {
    const previousLead = savedLead;
    setSavedLead(activeLead);
    onOptimisticSave?.(activeLead);
    try {
      const data = await fetchJson<{ lead: Lead }>("/api/leads", { method: "POST", body: JSON.stringify(activeLead) });
      setSavedLead(data.lead);
      onSaved?.(data.lead);
      return data.lead;
    } catch (error) {
      setSavedLead(previousLead);
      onSaveFailed?.(activeLead);
      throw error;
    }
  }

  async function saveLead() {
    setBusy(true);
    try {
      await persistLead();
      flash("saved");
    } catch {
      flash("error");
    } finally {
      setBusy(false);
    }
  }

  async function ensureSaved() {
    if (persisted || savedLead) return activeLead;
    return persistLead();
  }

  async function patchLead(patch: Partial<Lead>) {
    setBusy(true);
    try {
      const baseLead = await ensureSaved();
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${baseLead.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setSavedLead(data.lead);
      onSaved?.(data.lead);
      flash("updated");
    } catch {
      flash("error");
    } finally {
      setBusy(false);
    }
  }

  async function copyMessage() {
    await copyText(getOutreachMessage(activeLead, messageTone));
  }

  async function copyProposal() {
    await copyText(generateLeadProposal(activeLead).text);
  }

  async function copyAiMessage() {
    if (!generatedMessage) return;
    await copyText(generatedMessage);
  }

  async function copyText(text: string, nextFeedback: Feedback = "copied") {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        copyTextFallback(text);
      }
      flash(nextFeedback);
    } catch {
      try {
        copyTextFallback(text);
        flash(nextFeedback);
      } catch {
        flash("error");
      }
    }
  }

  async function generateAiMessage() {
    setBusy(true);
    try {
      const baseLead = await ensureSaved();
      const data = await fetchJson<{ message: string; model: string }>(`/api/leads/${baseLead.id}/ai-message`, {
        method: "POST",
        body: JSON.stringify({ tone: messageTone })
      });
      setGeneratedMessage(data.message);
      await copyText(data.message, "generated");
    } catch {
      flash("error");
    } finally {
      setBusy(false);
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
      firstContactAt: activeLead.firstContactAt ?? now,
      lastContactAt: now,
      contactChannel: channel,
      contactHistory: [
        ...activeLead.contactHistory,
        { id: crypto.randomUUID(), at: now, channel, note: `Contato registrado via ${channel}` }
      ]
    });
  }

  async function analyzeSite() {
    if (!activeLead.website) return;
    try {
      setBusy(true);
      const baseLead = await ensureSaved();
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${baseLead.id}/analyze-site`, { method: "POST" });
      setSavedLead(data.lead);
      onSaved?.(data.lead);
      flash("analyzed");
    } catch {
      flash("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={layout === "inline" ? "flex w-full flex-col gap-2" : "flex flex-col gap-2"}>
      <div className="no-scrollbar flex w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1">
        <ActionButton active={isSaved || feedback === "saved"} label={isSaved ? "Salvo" : "Salvar"} onClick={saveLead} icon={isSaved || feedback === "saved" ? Check : Save} disabled={busy || isSaved} />
        <select
          value={messageTone}
          onChange={(event) => setMessageTone(event.target.value as MessageTone)}
          aria-label="Tom da mensagem"
          className="h-8 shrink-0 rounded-lg border border-parchment bg-white px-2 text-[11px] font-bold text-charcoal outline-none focus:border-charcoal focus:ring-2 focus:ring-lavender/30 dark:border-white/10 dark:bg-[#1a1630] dark:text-white"
        >
          {(Object.keys(toneLabels) as MessageTone[]).map((tone) => (
            <option key={tone} value={tone}>{toneLabels[tone]}</option>
          ))}
        </select>
        <ActionButton active={feedback === "copied"} label="Copiar" onClick={copyMessage} icon={Copy} variant="secondary" disabled={busy} />
        <ActionButton active={feedback === "generated"} label={busy ? "IA..." : "IA"} onClick={generateAiMessage} icon={Bot} variant="secondary" disabled={busy} />
        <ActionButton active={feedback === "copied"} label="Proposta" onClick={copyProposal} icon={FileText} variant="secondary" disabled={busy} />
        {activeLead.website && <ActionButton active={feedback === "analyzed"} label={feedback === "analyzed" ? "OK site" : "Site"} onClick={analyzeSite} icon={Sparkles} variant="secondary" disabled={busy} />}

        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-parchment bg-stone-50/70 p-1 dark:border-white/10 dark:bg-white/5">
          <IconLink href={getGoogleSearchUrl(activeLead)} title="Buscar no Google" icon={Search} onClick={() => patchLead({ lastCheckedAt: new Date().toISOString() })} />
          <IconLink href={getInstagramSearchUrl(activeLead)} title="Buscar no Instagram" icon={Instagram} />
          <IconLink href={getFacebookSearchUrl(activeLead)} title="Buscar no Facebook" icon={Facebook} />
          {whatsappUrl && <IconLink href={whatsappUrl} title="Abrir WhatsApp" icon={MessageCircle} onClick={() => registerContact("WhatsApp")} />}
          <IconLink href={getMapUrl(activeLead)} title="Ver no OpenStreetMap" icon={MapPinned} />
        </div>

        <ActionButton
          active={advancedOpen}
          label={advancedOpen ? "Menos" : "Mais"}
          onClick={() => setAdvancedOpen((current) => !current)}
          icon={ChevronDown}
          variant="secondary"
          disabled={busy}
        />
      </div>

      {advancedOpen && (
        <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-parchment bg-stone-50/70 p-2 dark:border-white/10 dark:bg-white/5">
          <MiniButton label="Tem site" onClick={() => markWebsite("has_website")} disabled={busy} />
          <MiniButton label="Site ruim" onClick={() => markWebsite("bad_website")} disabled={busy} />
          <MiniButton label="Sem site" onClick={() => markWebsite("no_website")} disabled={busy} />
          <MiniButton label="Bom lead" onClick={markGoodLead} disabled={busy} />
          <MiniButton label="Descartar" onClick={discardLead} icon={Trash2} danger disabled={busy} />
        </div>
      )}

      {generatedMessage && (
        <div className="w-full rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-sm dark:border-sky-900/40 dark:bg-sky-950/30">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
              <Bot className="h-3.5 w-3.5" />
              Mensagem IA
            </span>
            <button type="button" onClick={copyAiMessage} className="text-xs font-bold text-sky-800 hover:underline dark:text-sky-200">
              Copiar
            </button>
          </div>
          <p className="mt-2 line-clamp-4 text-stone-700 dark:text-stone-200">{generatedMessage}</p>
        </div>
      )}

      <ActionFeedback
        className="w-full"
        tone={feedback === "error" ? "error" : "success"}
        message={
          feedback === "copied"
            ? "Copiado."
            : feedback === "generated"
              ? "Mensagem IA copiada."
            : feedback === "analyzed"
              ? "Site analisado."
              : feedback === "updated"
                ? "Lead atualizado."
                : feedback === "saved"
                  ? "Lead salvo."
                  : feedback === "error"
                    ? "Ação falhou. Tente novamente."
                    : null
        }
      />
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
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender/40 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && (active ? "bg-emerald-600 text-white" : "bg-charcoal text-white hover:opacity-90"),
        variant === "secondary" && (active ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200" : "bg-warm-cream text-charcoal hover:brightness-95")
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", Icon === ChevronDown && active ? "rotate-180" : "")} />
      <span className="whitespace-nowrap">{label}</span>
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
        "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition disabled:pointer-events-none disabled:opacity-50",
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

function IconLink({ icon: Icon, title, href, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; href: string; onClick?: () => void | Promise<void> }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-charcoal transition hover:bg-white dark:text-stone-300 dark:hover:bg-white/10"
    >
      <Icon className="h-3.5 w-3.5" />
      <ExternalLink className="sr-only" />
    </a>
  );
}
