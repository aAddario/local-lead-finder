"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, Copy, ExternalLink, FileText, Globe2, MessageCircle, RefreshCw, Target } from "lucide-react";
import { ActionFeedback } from "@/components/action-feedback";
import { EmptyState } from "@/components/empty-state";
import { LeadActions } from "@/components/lead-actions";
import { ScoreBadge } from "@/components/score-badge";
import { SkeletonRows } from "@/components/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { generateLeadDiagnosis } from "@/lib/diagnosis";
import { formatActionDate } from "@/lib/followups";
import { generateLeadProposal } from "@/lib/proposal";
import { contactChannels, leadStatuses, type ContactChannel, type Lead, type LeadStatus } from "@/types/lead";

type Feedback = { message: string; tone: "success" | "error" } | null;

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async function loadLead() {
    setLoading(true);
    setError("");
    fetchJson<{ lead: Lead }>(`/api/leads/${id}`)
      .then((data) => setLead(data.lead))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const diagnosis = useMemo(() => (lead ? generateLeadDiagnosis(lead) : null), [lead]);
  const proposal = useMemo(() => (lead ? generateLeadProposal(lead) : null), [lead]);

  async function update(patch: Partial<Lead>, message = "Lead atualizado.") {
    if (!lead) return;
    setBusy(true);
    setFeedback(null);
    try {
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setLead(data.lead);
      setFeedback({ tone: "success", message });
    } catch (err) {
      setFeedback({ tone: "error", message: err instanceof Error ? err.message : "Falha ao atualizar." });
    } finally {
      setBusy(false);
    }
  }

  async function analyzeSite() {
    if (!lead?.website) return;
    setBusy(true);
    setFeedback(null);
    try {
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}/analyze-site`, { method: "POST" });
      setLead(data.lead);
      setFeedback({ tone: "success", message: "Site analisado." });
    } catch (err) {
      setFeedback({ tone: "error", message: err instanceof Error ? err.message : "Falha ao analisar site." });
    } finally {
      setBusy(false);
    }
  }

  async function copyProposal() {
    if (!proposal) return;
    try {
      await navigator.clipboard.writeText(proposal.text);
      setFeedback({ tone: "success", message: "Proposta copiada." });
    } catch {
      setFeedback({ tone: "error", message: "Falha ao copiar proposta." });
    }
  }

  if (loading) return <div className="mx-auto max-w-7xl px-6 py-10"><Card className="p-6"><SkeletonRows /></Card></div>;
  if (error || !lead || !diagnosis || !proposal) return <div className="mx-auto max-w-7xl px-6 py-10"><EmptyState title="Lead não encontrado" text={error || "Registro indisponível."} /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/leads" className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 no-underline hover:text-charcoal dark:text-stone-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Leads
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ScoreBadge score={lead.score} label={lead.scoreLabel} />
            <StatusBadge status={lead.status} />
            <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600 dark:bg-white/10 dark:text-stone-200">
              Dados {lead.dataConfidenceScore}/100 · {lead.dataConfidenceLabel}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-4xl">{lead.name}</h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{lead.category} · {lead.city ?? "Cidade desconhecida"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noreferrer noopener" className="no-underline">
              <Button variant="cream"><ExternalLink className="h-4 w-4" />Site</Button>
            </a>
          )}
          <Button variant="dark" onClick={copyProposal}><Copy className="h-4 w-4" />Copiar proposta</Button>
        </div>
      </section>

      <ActionFeedback message={feedback?.message ?? null} tone={feedback?.tone ?? "success"} />

      <Card className="p-4">
        <LeadActions lead={lead} persisted onSaved={setLead} layout="inline" />
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <CrmSection lead={lead} busy={busy} update={update} />
          <DiagnosisSection diagnosis={diagnosis} />
          <ProposalSection proposal={proposal} onCopy={copyProposal} />
        </div>
        <div className="space-y-6">
          <SiteAnalysisSection lead={lead} busy={busy} onAnalyze={analyzeSite} />
          <TimelineSection lead={lead} />
          <ScoreSection lead={lead} />
        </div>
      </section>
    </div>
  );
}

function CrmSection({ lead, busy, update }: { lead: Lead; busy: boolean; update: (patch: Partial<Lead>, message?: string) => void }) {
  return (
    <Card className="p-6">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-charcoal dark:text-white">
        <CalendarClock className="h-5 w-5 text-stone-400" />
        CRM completo
      </h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Status">
          <Select value={lead.status} disabled={busy} onChange={(event) => update({ status: event.target.value as LeadStatus })}>
            {leadStatuses.map((status) => <option key={status}>{status}</option>)}
          </Select>
        </Field>
        <Field label="Canal">
          <Select value={lead.contactChannel ?? ""} disabled={busy} onChange={(event) => update({ contactChannel: (event.target.value || null) as ContactChannel | null })}>
            <option value="">Sem canal</option>
            {contactChannels.map((channel) => <option key={channel}>{channel}</option>)}
          </Select>
        </Field>
        <Field label="Telefone">
          <Input defaultValue={lead.phone ?? ""} disabled={busy} onBlur={(event) => update({ phone: event.target.value || null })} />
        </Field>
        <Field label="E-mail">
          <Input defaultValue={lead.email ?? ""} disabled={busy} onBlur={(event) => update({ email: event.target.value || null })} />
        </Field>
        <Field label="Website">
          <Input defaultValue={lead.website ?? ""} disabled={busy} onBlur={(event) => update({ website: event.target.value || null })} />
        </Field>
        <Field label="Instagram">
          <Input defaultValue={lead.instagramUrl ?? ""} disabled={busy} onBlur={(event) => update({ instagramUrl: event.target.value || null })} />
        </Field>
        <Field label="Facebook">
          <Input defaultValue={lead.facebookUrl ?? ""} disabled={busy} onBlur={(event) => update({ facebookUrl: event.target.value || null })} />
        </Field>
        <Field label="Valor estimado">
          <Input type="number" defaultValue={lead.estimatedValue ?? ""} disabled={busy} onBlur={(event) => update({ estimatedValue: event.target.value ? Number(event.target.value) : null })} />
        </Field>
        <Field label="Oferta">
          <Input defaultValue={lead.offerType ?? ""} disabled={busy} onBlur={(event) => update({ offerType: event.target.value || null })} />
        </Field>
        <Field label="Primeiro contato">
          <Input type="date" value={lead.firstContactAt?.slice(0, 10) ?? ""} disabled={busy} onChange={(event) => update({ firstContactAt: event.target.value || null })} />
        </Field>
        <Field label="Último contato">
          <Input type="date" value={lead.lastContactAt?.slice(0, 10) ?? ""} disabled={busy} onChange={(event) => update({ lastContactAt: event.target.value || null })} />
        </Field>
        <Field label="Próxima ação">
          <Input type="date" value={lead.nextActionAt?.slice(0, 10) ?? ""} disabled={busy} onChange={(event) => update({ nextActionAt: event.target.value || null })} />
        </Field>
        <Field label="Última checagem">
          <Input type="date" value={lead.lastCheckedAt?.slice(0, 10) ?? ""} disabled={busy} onChange={(event) => update({ lastCheckedAt: event.target.value || null })} />
        </Field>
      </div>
      <Field label="Observações" className="mt-4">
        <Textarea defaultValue={lead.notes} disabled={busy} onBlur={(event) => update({ notes: event.target.value })} className="min-h-32" />
      </Field>
    </Card>
  );
}

function DiagnosisSection({ diagnosis }: { diagnosis: ReturnType<typeof generateLeadDiagnosis> }) {
  return (
    <Card className="p-6">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-charcoal dark:text-white">
        <Target className="h-5 w-5 text-stone-400" />
        Diagnóstico do lead
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label="Problema provável" value={diagnosis.likelyProblem} />
        <Info label="Oportunidade" value={diagnosis.opportunity} />
        <Info label="Solução sugerida" value={diagnosis.solutionSuggested} />
        <Info label="Oferta recomendada" value={diagnosis.recommendedOffer} />
      </div>
    </Card>
  );
}

function ProposalSection({ proposal, onCopy }: { proposal: ReturnType<typeof generateLeadProposal>; onCopy: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-charcoal dark:text-white">
          <FileText className="h-5 w-5 text-stone-400" />
          Proposta
        </h2>
        <Button size="sm" variant="cream" onClick={onCopy}><Copy className="h-4 w-4" />Copiar</Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Info label="Prazo" value={proposal.suggestedDeadline} />
        <Info label="Faixa" value={proposal.suggestedPriceRange} />
      </div>
      <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-parchment bg-stone-50 p-4 text-sm leading-relaxed text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-200">
        {proposal.text}
      </pre>
    </Card>
  );
}

function SiteAnalysisSection({ lead, busy, onAnalyze }: { lead: Lead; busy: boolean; onAnalyze: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-charcoal dark:text-white">
          <Globe2 className="h-5 w-5 text-stone-400" />
          Análise do site
        </h2>
        <Button size="sm" variant="cream" onClick={onAnalyze} disabled={busy || !lead.website}><RefreshCw className="h-4 w-4" />Analisar</Button>
      </div>
      {lead.websiteAnalysisScore === null ? (
        <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Sem análise registrada.</p>
      ) : (
        <div className="mt-4">
          <div className="inline-flex rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
            {lead.websiteAnalysisScore}/100 · {lead.websiteAnalysisLabel}
          </div>
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">Atualizado: {formatActionDate(lead.websiteAnalyzedAt)}</p>
          <ul className="mt-4 space-y-2 text-sm text-stone-600 dark:text-stone-300">
            {lead.websiteAnalysisNotes.map((note) => <li key={note}>• {note}</li>)}
          </ul>
        </div>
      )}
    </Card>
  );
}

function TimelineSection({ lead }: { lead: Lead }) {
  const entries = [...lead.contactHistory].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Card className="p-6">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-charcoal dark:text-white">
        <MessageCircle className="h-5 w-5 text-stone-400" />
        Histórico de contato
      </h2>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500 dark:text-stone-400">Sem histórico ainda.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-3 rounded-xl border border-parchment bg-stone-50/70 p-3 dark:border-white/10 dark:bg-white/5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-charcoal dark:text-white">{formatActionDate(entry.at)} · {entry.channel}</p>
                <p className="text-sm text-stone-600 dark:text-stone-300">{entry.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ScoreSection({ lead }: { lead: Lead }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Score detalhado</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300">{lead.scoreExplanation}</p>
      <div className="mt-4 grid gap-3">
        <ReasonList title="Sinais positivos" reasons={lead.scorePositiveReasons.map((reason) => `+${reason.points} ${reason.label}`)} tone="green" />
        <ReasonList title="Bloqueios" reasons={lead.scoreNegativeReasons.map((reason) => `${reason.points} ${reason.label}`)} tone="red" />
      </div>
    </Card>
  );
}

function ReasonList({ title, reasons, tone }: { title: string; reasons: string[]; tone: "green" | "red" }) {
  const color = tone === "green" ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200";
  return (
    <div className="rounded-xl border border-parchment bg-stone-50/70 p-3 dark:border-white/10 dark:bg-white/5">
      <p className={`text-xs font-bold uppercase tracking-wider ${color}`}>{title}</p>
      <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-300">
        {reasons.length === 0 && <li>Nenhum item.</li>}
        {reasons.map((reason) => <li key={reason}>{reason}</li>)}
      </ul>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 ${className}`}>
      {label}
      <div className="text-base font-medium normal-case tracking-normal">{children}</div>
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-parchment bg-stone-50/70 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-200">{value}</p>
    </div>
  );
}
