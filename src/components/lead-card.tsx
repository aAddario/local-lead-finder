"use client";

import { useState } from "react";
import { CalendarClock, MinusCircle, PlusCircle } from "lucide-react";
import { LeadActions } from "@/components/lead-actions";
import { ScoreBadge } from "@/components/score-badge";
import { StatusBadge } from "@/components/status-badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { generateLeadDiagnosis } from "@/lib/diagnosis";
import { fetchJson } from "@/lib/api";
import { contactChannels, leadStatuses, type ContactChannel, type Lead, type LeadStatus } from "@/types/lead";

type LeadCardProps = {
  lead: Lead;
  editable?: boolean;
  onChange?: (lead: Lead) => void;
};

export function LeadCard({ lead, editable = false, onChange }: LeadCardProps) {
  const diagnosis = generateLeadDiagnosis(lead);

  return (
    <article className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:shadow-tight dark:border-white/10 dark:bg-[#16122b]">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <ScoreBadge score={lead.score} label={lead.scoreLabel} />
            <Badge>{lead.validationStatus === "verified" ? "Verificado" : lead.validationStatus === "discarded" ? "Descartado" : "Pendente"}</Badge>
            <Badge>{formatWebsiteStatus(lead.websiteStatus)}</Badge>
          </div>
          {editable ? <StatusEditor lead={lead} onChange={onChange} /> : lead.status !== "Novo" ? <StatusBadge status={lead.status} /> : null}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-charcoal dark:text-white">{lead.name}</h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
          {lead.category && <Meta label="Categoria" value={lead.category} />}
          {lead.city && <Meta label="Cidade" value={lead.city} />}
          {lead.phone ? <a href={`tel:${lead.phone}`} className="hover:text-charcoal hover:underline dark:hover:text-white">{lead.phone}</a> : <span className="italic opacity-60">Sem telefone</span>}
          {lead.website ? (
            <a href={lead.website} target="_blank" rel="noreferrer noopener" className="text-amethyst hover:underline">Site</a>
          ) : (
            <span className="italic opacity-60">Sem site</span>
          )}
        </div>

        <ScoreBreakdown lead={lead} />

        <section className="mt-4 rounded-xl border border-parchment bg-stone-50/70 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold tracking-tight text-charcoal dark:text-white">Diagnóstico do lead</h4>
            <Badge>{diagnosis.priorityLevel}</Badge>
          </div>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <DiagnosticItem label="Problema provável" value={diagnosis.likelyProblem} />
            <DiagnosticItem label="Oportunidade" value={diagnosis.opportunity} />
            <DiagnosticItem label="Solução sugerida" value={diagnosis.solutionSuggested} />
            <DiagnosticItem label="Oferta recomendada" value={diagnosis.recommendedOffer} />
          </div>
        </section>

        {lead.websiteAnalysisScore !== null && (
          <section className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm dark:border-sky-900/40 dark:bg-sky-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-charcoal dark:text-white">Análise do site</h4>
              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-sky-700 dark:bg-white/10 dark:text-sky-300">
                {lead.websiteAnalysisScore}/100 · {lead.websiteAnalysisLabel}
              </span>
            </div>
            <ul className="mt-3 space-y-1 text-stone-600 dark:text-stone-300">
              {lead.websiteAnalysisNotes.slice(0, 5).map((note) => <li key={note}>• {note}</li>)}
            </ul>
          </section>
        )}

        {editable && <CrmEditor lead={lead} onChange={onChange} />}

        {editable ? (
          <div className="mt-4">
            <NotesEditor lead={lead} onChange={onChange} />
          </div>
        ) : lead.notes ? (
          <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{lead.notes}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 px-5 py-3 dark:border-white/5">
        <LeadActions lead={lead} onSaved={onChange} layout="inline" />
      </div>
    </article>
  );
}

function ScoreBreakdown({ lead }: { lead: Lead }) {
  return (
    <section className="mt-4 grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/20">
        <h4 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          <PlusCircle className="h-4 w-4" />
          Motivos positivos
        </h4>
        <ul className="mt-2 space-y-1 text-sm text-emerald-900 dark:text-emerald-100">
          {lead.scorePositiveReasons.length === 0 && <li>Nenhum sinal forte.</li>}
          {lead.scorePositiveReasons.map((reason) => <li key={`${reason.label}-${reason.points}`}>+{reason.points} {reason.label}</li>)}
        </ul>
      </div>
      <div className="rounded-xl border border-red-100 bg-red-50/70 p-3 dark:border-red-900/30 dark:bg-red-950/20">
        <h4 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
          <MinusCircle className="h-4 w-4" />
          Motivos negativos
        </h4>
        <ul className="mt-2 space-y-1 text-sm text-red-900 dark:text-red-100">
          {lead.scoreNegativeReasons.length === 0 && <li>Nenhum bloqueio forte.</li>}
          {lead.scoreNegativeReasons.map((reason) => <li key={`${reason.label}-${reason.points}`}>{reason.points} {reason.label}</li>)}
        </ul>
      </div>
      {lead.scoreExplanation && <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300 md:col-span-2">{lead.scoreExplanation}</p>}
    </section>
  );
}

function CrmEditor({ lead, onChange }: { lead: Lead; onChange?: (lead: Lead) => void }) {
  async function update(patch: Partial<Lead>) {
    const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    onChange?.(data.lead);
  }

  return (
    <section className="mt-4 rounded-xl border border-parchment p-4 dark:border-white/10">
      <h4 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-charcoal dark:text-white">
        <CalendarClock className="h-4 w-4 text-stone-400" />
        CRM rápido
      </h4>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="grid gap-1 text-xs font-semibold text-stone-500">
          Valor estimado
          <Input
            type="number"
            value={lead.estimatedValue ?? ""}
            onChange={(event) => update({ estimatedValue: event.target.value ? Number(event.target.value) : null })}
            className="text-sm"
          />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-stone-500">
          Oferta
          <Input value={lead.offerType ?? ""} onChange={(event) => update({ offerType: event.target.value || null })} className="text-sm" />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-stone-500">
          Canal
          <Select value={lead.contactChannel ?? ""} onChange={(event) => update({ contactChannel: (event.target.value || null) as ContactChannel | null })} className="text-sm">
            <option value="">Sem canal</option>
            {contactChannels.map((channel) => <option key={channel}>{channel}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-stone-500">
          Próxima ação
          <Input type="date" value={lead.nextActionAt?.slice(0, 10) ?? ""} onChange={(event) => update({ nextActionAt: event.target.value || null })} className="text-sm" />
        </label>
      </div>
    </section>
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
      {leadStatuses.map((status) => <option key={status}>{status}</option>)}
    </Select>
  );
}

function NotesEditor({ lead, onChange }: { lead: Lead; onChange?: (lead: Lead) => void }) {
  const [notes, setNotes] = useState(lead.notes);
  async function save() {
    const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ notes }) });
    onChange?.(data.lead);
  }
  return <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={save} placeholder="Observações..." className="min-h-[70px] text-sm" />;
}

function DiagnosticItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-1 leading-relaxed text-stone-700 dark:text-stone-200">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-lg bg-warm-cream px-2.5 py-1 text-xs font-bold text-charcoal dark:bg-white/10 dark:text-white">{children}</span>;
}

function formatWebsiteStatus(status: Lead["websiteStatus"]) {
  const labels: Record<Lead["websiteStatus"], string> = {
    unknown: "Site desconhecido",
    no_website: "Sem site confirmado",
    has_website: "Tem site",
    bad_website: "Site ruim",
    good_website: "Site bom"
  };
  return labels[status];
}
