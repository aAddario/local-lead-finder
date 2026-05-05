"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { LeadActions } from "@/components/lead-actions";
import { ScoreBadge } from "@/components/score-badge";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { leadStatuses, type Lead, type LeadStatus } from "@/types/lead";

type LeadCardProps = {
  lead: Lead;
  editable?: boolean;
  persisted?: boolean;
  onChange?: (lead: Lead) => void;
  onPersisted?: (lead: Lead) => void;
};

export function LeadCard({ lead, editable = false, persisted = editable, onChange, onPersisted }: LeadCardProps) {
  const [optimisticPersisted, setOptimisticPersisted] = useState(false);
  const isPersisted = persisted || optimisticPersisted;

  useEffect(() => {
    setOptimisticPersisted(false);
  }, [lead.id]);

  return (
    <article className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:shadow-tight dark:border-white/10 dark:bg-[#16122b]">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <ScoreBadge score={lead.score} label={lead.scoreLabel} />
            <Badge tone={lead.dataConfidenceScore >= 75 ? "saved" : "muted"}>Dados {lead.dataConfidenceLabel}</Badge>
            <Badge tone={isPersisted ? "saved" : "muted"}>{isPersisted ? "Salvo" : "Não salvo"}</Badge>
            <Badge>{lead.validationStatus === "verified" ? "Verificado" : lead.validationStatus === "discarded" ? "Descartado" : "Pendente"}</Badge>
            <Badge>{formatWebsiteStatus(lead.websiteStatus)}</Badge>
          </div>
          {editable ? <StatusEditor lead={lead} onChange={onChange} /> : lead.status !== "Novo" ? <StatusBadge status={lead.status} /> : null}
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-lg font-semibold leading-snug text-charcoal dark:text-white">{lead.name}</h3>
          {isPersisted ? (
            <Link href={`/leads/${lead.id}`} className="no-underline">
              <Button size="sm" variant="cream">
                Detalhes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500 dark:bg-white/5 dark:text-stone-400">Salve para abrir</span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
          {lead.category && <Meta label="Categoria" value={lead.category} />}
          {lead.city && <Meta label="Cidade" value={lead.city} />}
          {lead.phone ? <a href={`tel:${lead.phone}`} className="hover:text-charcoal hover:underline dark:hover:text-white">{lead.phone}</a> : <span className="italic opacity-60">Sem telefone</span>}
          {lead.email ? <a href={`mailto:${lead.email}`} className="hover:text-charcoal hover:underline dark:hover:text-white">{lead.email}</a> : null}
          {lead.website ? (
            <a href={lead.website} target="_blank" rel="noreferrer noopener" className="text-amethyst hover:underline">Site</a>
          ) : (
            <span className="italic opacity-60">Sem site</span>
          )}
        </div>

        <div className="mt-4 grid gap-2 text-sm md:grid-cols-[1fr_auto] md:items-center">
          <p className="line-clamp-2 leading-relaxed text-stone-600 dark:text-stone-300">
            {lead.scoreExplanation || "Sem explicação de score registrada."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="muted">{lead.scorePositiveReasons.length} sinais</Badge>
            <Badge tone="muted">{lead.scoreNegativeReasons.length} bloqueios</Badge>
            {lead.nextActionAt && <Badge>Próx. {lead.nextActionAt.slice(0, 10)}</Badge>}
          </div>
        </div>

        {lead.notes ? <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{lead.notes}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 px-5 py-3 dark:border-white/5">
        <LeadActions
          lead={lead}
          onSaved={(updated) => {
            onChange?.(updated);
            onPersisted?.(updated);
            setOptimisticPersisted(false);
          }}
          onOptimisticSave={() => setOptimisticPersisted(true)}
          onSaveFailed={() => setOptimisticPersisted(false)}
          layout="inline"
          persisted={isPersisted}
        />
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
      {leadStatuses.map((status) => <option key={status}>{status}</option>)}
    </Select>
  );
}


function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "saved" | "muted" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold",
        tone === "saved" ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "",
        tone === "muted" ? "bg-stone-100 text-stone-600 dark:bg-white/5 dark:text-stone-300" : "",
        tone === "default" ? "bg-warm-cream text-charcoal dark:bg-white/10 dark:text-white" : ""
      ].join(" ")}
    >
      {tone === "saved" && <CheckCircle2 className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
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
