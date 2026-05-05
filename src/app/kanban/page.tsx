"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bot, CalendarClock, DollarSign, GripVertical, Loader2, MoveRight, Sparkles } from "lucide-react";
import { ScoreBadge } from "@/components/score-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { cn } from "@/lib/utils";
import { leadStatuses, type Lead, type LeadStatus } from "@/types/lead";

type Feedback = { message: string; tone: "success" | "error" } | null;

const statusStyle: Record<LeadStatus, { rail: string; chip: string; hint: string }> = {
  Novo: { rail: "bg-stone-300", chip: "bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-200", hint: "Entrada" },
  Verificar: { rail: "bg-amber-400", chip: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200", hint: "Checagem" },
  Verificado: { rail: "bg-sky-400", chip: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200", hint: "Pronto" },
  "Contato enviado": { rail: "bg-violet-400", chip: "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200", hint: "Contato" },
  Respondeu: { rail: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200", hint: "Resposta" },
  "Reunião marcada": { rail: "bg-cyan-400", chip: "bg-cyan-50 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200", hint: "Reunião" },
  "Proposta enviada": { rail: "bg-indigo-400", chip: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200", hint: "Oferta" },
  Fechado: { rail: "bg-green-500", chip: "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200", hint: "Ganho" },
  Perdido: { rail: "bg-red-400", chip: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200", hint: "Perdido" },
  Descartado: { rail: "bg-stone-500", chip: "bg-stone-100 text-stone-700 dark:bg-white/10 dark:text-stone-200", hint: "Fora" }
};

export default function KanbanPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);
  const [aiBusyId, setAiBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ leads: Lead[] }>("/api/leads")
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const byStatus = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    for (const status of leadStatuses) map.set(status, []);
    for (const lead of leads) map.get(lead.status)?.push(lead);
    for (const status of leadStatuses) {
      map.set(status, [...(map.get(status) ?? [])].sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt)));
    }
    return map;
  }, [leads]);

  const stats = useMemo(() => {
    const active = leads.filter((lead) => !["Fechado", "Perdido", "Descartado"].includes(lead.status));
    return {
      total: leads.length,
      hot: active.filter((lead) => lead.score >= 80).length,
      contacted: leads.filter((lead) => ["Contato enviado", "Respondeu", "Reunião marcada", "Proposta enviada", "Fechado"].includes(lead.status)).length,
      value: active.reduce((sum, lead) => sum + (lead.estimatedValue ?? suggestEstimatedValue(lead)), 0)
    };
  }, [leads]);

  async function setStatus(lead: Lead, status: LeadStatus) {
    const previous = leads;
    const patch: Partial<Lead> = { status };
    if (status === "Contato enviado") patch.lastContactAt = new Date().toISOString();
    if (status === "Proposta enviada" && !lead.estimatedValue) patch.estimatedValue = suggestEstimatedValue(lead);

    setError("");
    setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item)));
    try {
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      setLeads((current) => current.map((item) => (item.id === lead.id ? data.lead : item)));
    } catch (err) {
      setLeads(previous);
      setError(err instanceof Error ? err.message : "Falha ao mover lead.");
    }
  }

  async function dropOnStatus(status: LeadStatus) {
    const lead = leads.find((item) => item.id === draggingId);
    setDraggingId(null);
    setDragOverStatus(null);
    if (!lead || lead.status === status) return;
    await setStatus(lead, status);
  }

  async function generateAiMessage(lead: Lead) {
    setAiBusyId(lead.id);
    setFeedback(null);
    try {
      const data = await fetchJson<{ message: string }>(`/api/leads/${lead.id}/ai-message`, {
        method: "POST",
        body: JSON.stringify({ tone: "professional" })
      });
      await copyText(data.message);
      setFeedback({ tone: "success", message: `Mensagem IA copiada para ${lead.name}.` });
    } catch (err) {
      setFeedback({ tone: "error", message: err instanceof Error ? err.message : "Falha ao gerar mensagem IA." });
    } finally {
      setAiBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-8 sm:px-6">
      <section className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Mini CRM</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
            Pipeline compacto, arrastável e pronto para abordagem.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
            Arraste cards, ajuste status e gere uma mensagem IA específica sem sair do quadro.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:w-[560px]">
          <MiniMetric label="Leads" value={stats.total.toString()} />
          <MiniMetric label="Score 80+" value={stats.hot.toString()} />
          <MiniMetric label="Contatos" value={stats.contacted.toString()} />
          <MiniMetric label="Pipeline" value={`R$ ${stats.value.toLocaleString("pt-BR")}`} />
        </div>
      </section>

      {feedback && (
        <Card className={cn("p-3 text-sm font-semibold", feedback.tone === "error" ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300")}>
          {feedback.message}
        </Card>
      )}

      {loading && (
        <div className="grid gap-4 md:grid-cols-4">
          {leadStatuses.slice(0, 4).map((status) => <Card key={status} className="h-64 animate-pulse bg-stone-100 dark:bg-white/5" />)}
        </div>
      )}
      {error && <EmptyState title="Kanban indisponível" text={error} />}
      {!loading && !error && leads.length === 0 && <EmptyState title="Nenhum lead salvo" text="Salve leads da busca primeiro." />}
      {!loading && leads.length > 0 && (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
          {leadStatuses.map((status) => {
            const columnLeads = byStatus.get(status) ?? [];
            const style = statusStyle[status];
            return (
              <section
                key={status}
                className={cn(
                  "w-[280px] shrink-0 rounded-2xl border border-parchment bg-stone-50/80 p-3 transition dark:border-white/10 dark:bg-white/5",
                  dragOverStatus === status && "border-lavender bg-lavender/10 ring-2 ring-lavender/30"
                )}
                onDragOver={(event) => event.preventDefault()}
                onDragEnter={() => setDragOverStatus(status)}
                onDragLeave={() => setDragOverStatus((current) => (current === status ? null : current))}
                onDrop={() => dropOnStatus(status)}
              >
                <div className={cn("mb-3 h-1.5 rounded-full", style.rail)} />
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-charcoal dark:text-white">{status}</h2>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{style.hint}</p>
                  </div>
                  <span className={cn("rounded-lg px-2 py-1 text-xs font-bold", style.chip)}>{columnLeads.length}</span>
                </div>

                <div className="space-y-3">
                  {columnLeads.length === 0 && (
                    <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-parchment bg-white/60 p-4 text-center text-xs font-semibold text-stone-400 dark:border-white/10 dark:bg-white/5">
                      Solte lead aqui
                    </div>
                  )}
                  {columnLeads.map((lead) => (
                    <article
                      key={lead.id}
                      draggable
                      onDragStart={() => setDraggingId(lead.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverStatus(null);
                      }}
                      className={cn(
                        "group cursor-grab rounded-xl border border-parchment bg-white p-3 shadow-tight transition hover:-translate-y-0.5 hover:border-lavender active:cursor-grabbing dark:border-white/10 dark:bg-[#17142a] dark:hover:border-lavender/50",
                        draggingId === lead.id && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-stone-300 group-hover:text-stone-500" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-bold leading-snug text-charcoal dark:text-white">{lead.name}</p>
                          <p className="mt-1 truncate text-xs font-semibold text-stone-500 dark:text-stone-400">
                            {lead.category} · {lead.city ?? "sem cidade"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <ScoreBadge score={lead.score} label={lead.scoreLabel} />
                        {!lead.website && <span className="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">sem site</span>}
                        {lead.phone && <span className="rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">fone</span>}
                      </div>

                      <div className="mt-3 grid gap-1 text-xs text-stone-500 dark:text-stone-400">
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          R$ {(lead.estimatedValue ?? suggestEstimatedValue(lead)).toLocaleString("pt-BR")}
                        </span>
                        {lead.nextActionAt && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {lead.nextActionAt.slice(0, 10)}
                          </span>
                        )}
                      </div>

                      <Select className="mt-3 h-8 px-2 text-xs" value={lead.status} onChange={(event) => setStatus(lead, event.target.value as LeadStatus)}>
                        {leadStatuses.map((item) => <option key={item}>{item}</option>)}
                      </Select>

                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="cream" className="h-8 flex-1 px-2 text-xs" onClick={() => setStatus(lead, "Contato enviado")}>
                          <MoveRight className="h-3.5 w-3.5" />
                          Contato
                        </Button>
                        <button
                          type="button"
                          onClick={() => generateAiMessage(lead)}
                          disabled={aiBusyId === lead.id}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-charcoal text-white transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                          title="Gerar mensagem IA"
                          aria-label={`Gerar mensagem IA para ${lead.name}`}
                        >
                          {aiBusyId === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                        </button>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warm-cream text-charcoal no-underline transition hover:brightness-95"
                          title="Abrir detalhes"
                          aria-label={`Abrir detalhes de ${lead.name}`}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-parchment bg-white px-3 py-2 shadow-tight dark:border-white/10 dark:bg-white/5">
      <p className="truncate text-sm font-bold text-charcoal dark:text-white">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
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

function suggestEstimatedValue(lead: Lead) {
  if (!lead.website || lead.websiteStatus === "no_website") return 900;
  if (lead.websiteStatus === "bad_website") return 1800;
  return lead.score >= 80 ? 3000 : 1200;
}
