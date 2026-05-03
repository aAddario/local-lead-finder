"use client";

import { useState } from "react";
import { Check, Copy, Instagram, MapPinned, Save, Search } from "lucide-react";
import { ScoreBadge } from "@/components/score-badge";
import { StatusBadge } from "@/components/status-badge";
import { Select, Textarea } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { getGoogleSearchUrl, getInstagramSearchUrl, getMapUrl, getOutreachMessage } from "@/lib/outreach";
import { leadStatuses, type Lead, type LeadStatus } from "@/types/lead";

type LeadCardProps = {
  lead: Lead;
  editable?: boolean;
  onChange?: (lead: Lead) => void;
};

export function LeadCard({ lead, editable = false, onChange }: LeadCardProps) {
  return (
    <article className="group rounded-xl border border-stone-200 bg-white transition hover:shadow-sm dark:border-white/10 dark:bg-[#16122b]">
      <div className="p-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <ScoreBadge score={lead.score} label={lead.scoreLabel} />
            {lead.scoreReasons.length > 0 && (
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {lead.scoreReasons.slice(0, 2).join(" · ")}
              </span>
            )}
          </div>
          {editable ? (
            <StatusEditor lead={lead} onChange={onChange} />
          ) : lead.status !== "Novo" ? (
            <StatusBadge status={lead.status} />
          ) : null}
        </div>

        {/* Name */}
        <h3 className="mt-2 text-lg font-semibold leading-snug text-charcoal dark:text-white">
          {lead.name}
        </h3>

        {/* Meta */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
          {lead.category && <Meta label="Categoria" value={lead.category} />}
          {lead.city && <Meta label="Cidade" value={lead.city} />}
          {lead.phone ? (
            <a href={`tel:${lead.phone}`} className="hover:text-charcoal hover:underline dark:hover:text-white">
              {lead.phone}
            </a>
          ) : (
            <span className="italic opacity-60">Sem telefone</span>
          )}
          {lead.website ? (
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer noopener"
              className="text-amethyst hover:underline"
            >
              Site →
            </a>
          ) : (
            <span className="italic opacity-60">Sem site</span>
          )}
        </div>

        {/* Notes */}
        {editable ? (
          <div className="mt-3">
            <NotesEditor lead={lead} onChange={onChange} />
          </div>
        ) : lead.notes ? (
          <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            {lead.notes}
          </p>
        ) : null}
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 px-5 py-3 dark:border-white/5">
        <LeadActionBar lead={lead} onSaved={onChange} />
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span className="sr-only">{label}: </span>
      {value}
    </span>
  );
}

function StatusEditor({ lead, onChange }: { lead: Lead; onChange?: (lead: Lead) => void }) {
  async function update(status: LeadStatus) {
    const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    onChange?.(data.lead);
  }
  return (
    <Select value={lead.status} onChange={(event) => update(event.target.value as LeadStatus)} className="h-8 w-auto text-xs">
      {leadStatuses.map((status) => (
        <option key={status}>{status}</option>
      ))}
    </Select>
  );
}

function NotesEditor({ lead, onChange }: { lead: Lead; onChange?: (lead: Lead) => void }) {
  const [notes, setNotes] = useState(lead.notes);
  async function save() {
    const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ notes }) });
    onChange?.(data.lead);
  }
  return (
    <Textarea
      value={notes}
      onChange={(event) => setNotes(event.target.value)}
      onBlur={save}
      placeholder="Observações..."
      className="min-h-[60px] text-sm"
    />
  );
}

function LeadActionBar({ lead, onSaved }: { lead: Lead; onSaved?: (lead: Lead) => void }) {
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
    <>
      <div className="flex items-center gap-2">
        <ActionBtn
          onClick={saveLead}
          icon={feedback === "saved" ? Check : Save}
          label={feedback === "saved" ? "Salvo" : "Salvar"}
          active={feedback === "saved"}
        />
        <ActionBtn
          onClick={copyMessage}
          icon={feedback === "copied" ? Check : Copy}
          label={feedback === "copied" ? "Copiado" : "Copiar mensagem"}
          variant="secondary"
          active={feedback === "copied"}
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <IconLink href={getGoogleSearchUrl(lead)} icon={Search} label="Google" />
        <IconLink href={getInstagramSearchUrl(lead)} icon={Instagram} label="Instagram" />
        <IconLink href={getMapUrl(lead)} icon={MapPinned} label="Mapa" />
      </div>

      {feedback === "error" && (
        <span className="w-full text-xs font-medium text-red-600 dark:text-red-300">Erro. Tente novamente.</span>
      )}
    </>
  );
}

function ActionBtn({
  onClick,
  icon: Icon,
  label,
  variant = "primary",
  active
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  variant?: "primary" | "secondary";
  active?: boolean;
}) {
  const base = "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition";
  const styles =
    variant === "primary"
      ? active
        ? "bg-emerald-600 text-white"
        : "bg-charcoal text-white hover:opacity-90"
      : active
        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
        : "border border-stone-200 bg-white text-charcoal hover:bg-stone-50 dark:border-white/10 dark:bg-transparent dark:text-stone-300 dark:hover:bg-white/5";

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function IconLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={label}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition hover:border-charcoal hover:text-charcoal dark:border-white/10 dark:bg-transparent dark:text-stone-400 dark:hover:border-white/30 dark:hover:text-white"
    >
      <Icon className="h-3.5 w-3.5" />
    </a>
  );
}
