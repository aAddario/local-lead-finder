"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, DollarSign } from "lucide-react";
import { ScoreBadge } from "@/components/score-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { leadStatuses, type Lead, type LeadStatus } from "@/types/lead";

export default function KanbanPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

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
    return map;
  }, [leads]);

  async function setStatus(lead: Lead, status: LeadStatus) {
    const patch: Partial<Lead> = { status };
    if (status === "Contato enviado") patch.lastContactAt = new Date().toISOString();
    if (status === "Proposta enviada" && !lead.estimatedValue) patch.estimatedValue = suggestEstimatedValue(lead);
    const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(patch) });
    setLeads((current) => current.map((item) => (item.id === lead.id ? data.lead : item)));
  }

  async function dropOnStatus(status: LeadStatus) {
    const lead = leads.find((item) => item.id === draggingId);
    setDraggingId(null);
    if (!lead || lead.status === status) return;
    await setStatus(lead, status);
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-10">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Mini CRM</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
          Pipeline de prospecção local.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
          Arraste cards entre colunas ou altere o status no seletor.
        </p>
      </section>

      {loading && (
        <div className="grid gap-4 md:grid-cols-4">
          {leadStatuses.slice(0, 4).map((status) => <Card key={status} className="h-64 animate-pulse bg-stone-100 dark:bg-white/5" />)}
        </div>
      )}
      {error && <EmptyState title="Kanban indisponível" text={error} />}
      {!loading && !error && leads.length === 0 && <EmptyState title="Nenhum lead salvo" text="Salve leads da busca primeiro." />}
      {!loading && leads.length > 0 && (
        <div className="grid auto-cols-[290px] grid-flow-col gap-4 overflow-x-auto pb-3">
          {leadStatuses.map((status) => (
            <Card
              key={status}
              className="min-h-[520px] p-4"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOnStatus(status)}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-tight text-charcoal dark:text-white">{status}</h2>
                <span className="rounded-lg bg-warm-cream px-2.5 py-1 text-xs font-bold text-charcoal dark:bg-white/10 dark:text-white">
                  {byStatus.get(status)?.length ?? 0}
                </span>
              </div>
              <div className="space-y-3">
                {byStatus.get(status)?.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggingId(lead.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className="cursor-grab rounded-xl border border-parchment bg-white p-4 transition hover:border-lavender active:cursor-grabbing dark:border-white/10 dark:bg-[#17142a] dark:hover:border-lavender/50"
                  >
                    <p className="font-bold text-charcoal dark:text-white">{lead.name}</p>
                    <p className="mb-2 text-xs text-stone-500 dark:text-stone-400">{lead.category} · {lead.city ?? "sem cidade"}</p>
                    <ScoreBadge score={lead.score} label={lead.scoreLabel} />
                    <div className="mt-3 grid gap-1 text-xs text-stone-500 dark:text-stone-400">
                      {lead.estimatedValue !== null && (
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          R$ {lead.estimatedValue.toLocaleString("pt-BR")}
                        </span>
                      )}
                      {lead.nextActionAt && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {lead.nextActionAt.slice(0, 10)}
                        </span>
                      )}
                    </div>
                    <Select className="mt-3 text-sm" value={lead.status} onChange={(event) => setStatus(lead, event.target.value as LeadStatus)}>
                      {leadStatuses.map((item) => <option key={item}>{item}</option>)}
                    </Select>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="cream" onClick={() => setStatus(lead, "Contato enviado")}>Contato</Button>
                      <Button size="sm" variant="ghost" onClick={() => setStatus(lead, "Descartado")}>Descartar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function suggestEstimatedValue(lead: Lead) {
  if (!lead.website || lead.websiteStatus === "no_website") return 900;
  if (lead.websiteStatus === "bad_website") return 1800;
  return lead.score >= 80 ? 3000 : 1200;
}
