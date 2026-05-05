"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle, Download, Filter, Plus, X } from "lucide-react";
import { LeadCard } from "@/components/lead-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { leadStatuses, type Campaign, type CampaignMetrics, type Lead, type LeadStatus } from "@/types/lead";

type CampaignDetail = {
  campaign: Campaign;
  leads: Lead[];
  availableLeads: Lead[];
  metrics: CampaignMetrics;
};

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<CampaignDetail | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "hot" | "warm" | "no_site" | "bad_site">("all");
  const [error, setError] = useState("");

  const load = useCallback(async function loadCampaign() {
    fetchJson<CampaignDetail>(`/api/campaigns/${id}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const leadOptions = useMemo(() => {
    if (!data) return [];
    const linked = new Set(data.campaign.leadIds);
    return data.availableLeads.filter((lead) => !linked.has(lead.id));
  }, [data]);

  const filteredLeads = useMemo(() => {
    if (!data) return [];
    return data.leads.filter((lead) => {
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" ||
        (priorityFilter === "hot" && lead.score >= 80) ||
        (priorityFilter === "warm" && lead.score >= 60 && lead.score < 80) ||
        (priorityFilter === "no_site" && (!lead.website || lead.websiteStatus === "no_website")) ||
        (priorityFilter === "bad_site" && (lead.websiteStatus === "bad_website" || lead.websiteAnalysisLabel === "Site ruim"));
      return matchesStatus && matchesPriority;
    });
  }, [data, priorityFilter, statusFilter]);

  async function updateLeadIds(leadIds: string[]) {
    const next = await fetchJson<{ campaign: Campaign; metrics: CampaignMetrics }>(`/api/campaigns/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ leadIds })
    });
    setData((current) => current ? { ...current, campaign: next.campaign, metrics: next.metrics, leads: current.availableLeads.filter((lead) => next.campaign.leadIds.includes(lead.id)) } : current);
  }

  async function addLead() {
    if (!data || !selectedLeadId) return;
    await updateLeadIds([...data.campaign.leadIds, selectedLeadId]);
    setSelectedLeadId("");
  }

  async function removeLead(leadId: string) {
    if (!data) return;
    await updateLeadIds(data.campaign.leadIds.filter((id) => id !== leadId));
  }

  if (error) return <div className="mx-auto max-w-6xl px-6 py-10"><Card className="p-6 text-red-600">{error}</Card></div>;
  if (!data) return <div className="mx-auto max-w-6xl px-6 py-10"><Card className="h-48 animate-pulse bg-stone-100 dark:bg-white/5" /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Campanha</p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">{data.campaign.name}</h1>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{data.campaign.objective}</p>
        </div>
        <a href={`/api/export?scope=campaign&campaignId=${data.campaign.id}`} className="no-underline">
          <Button variant="cream">
            <Download className="h-4 w-4" />
            Exportar campanha
          </Button>
        </a>
      </section>

      <MetricGrid metrics={data.metrics} />
      <ProgressChecklist metrics={data.metrics} totalLeads={data.leads.length} />

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-charcoal dark:text-white">
          <Filter className="h-4 w-4 text-stone-400" />
          Filtros da campanha
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <Select value={selectedLeadId} onChange={(event) => setSelectedLeadId(event.target.value)}>
            <option value="">Selecionar lead para vincular</option>
            {leadOptions.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.city ?? "sem cidade"} · {lead.score}</option>)}
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "all")}>
            <option value="all">Todos status</option>
            {leadStatuses.map((status) => <option key={status}>{status}</option>)}
          </Select>
          <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}>
            <option value="all">Toda prioridade</option>
            <option value="hot">Score 80+</option>
            <option value="warm">Score 60-79</option>
            <option value="no_site">Sem site</option>
            <option value="bad_site">Site ruim</option>
          </Select>
          <Button variant="dark" onClick={addLead} disabled={!selectedLeadId}>
            <Plus className="h-4 w-4" />
            Vincular lead
          </Button>
        </div>
        <p className="mt-3 text-xs font-semibold text-stone-500 dark:text-stone-400">
          {filteredLeads.length}/{data.leads.length} leads visíveis.
        </p>
      </Card>

      {data.leads.length === 0 ? (
        <Card className="p-10 text-center text-sm text-stone-500">Nenhum lead vinculado.</Card>
      ) : filteredLeads.length === 0 ? (
        <Card className="p-10 text-center text-sm text-stone-500">Nenhum lead corresponde aos filtros.</Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="relative">
              <button
                type="button"
                onClick={() => removeLead(lead.id)}
                className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-500 shadow-tight hover:text-red-600 dark:bg-[#1a1630]"
                title="Remover da campanha"
              >
                <X className="h-4 w-4" />
              </button>
              <LeadCard lead={lead} editable onChange={(updated) => setData((current) => current ? { ...current, leads: current.leads.map((item) => item.id === updated.id ? updated : item) } : current)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressChecklist({ metrics, totalLeads }: { metrics: CampaignMetrics; totalLeads: number }) {
  const items = [
    { label: "Leads vinculados", done: totalLeads > 0, hint: `${totalLeads} no lote` },
    { label: "Validação iniciada", done: metrics.verified > 0, hint: `${metrics.verified} verificados` },
    { label: "Primeiros contatos", done: metrics.contacted > 0, hint: `${metrics.contacted} contatos` },
    { label: "Resposta recebida", done: metrics.responses > 0, hint: `${metrics.responses} respostas` },
    { label: "Proposta enviada", done: metrics.proposals > 0, hint: `${metrics.proposals} propostas` },
    { label: "Fechamento", done: metrics.closed > 0, hint: `${metrics.closed} ganhos` }
  ];
  const doneCount = items.filter((item) => item.done).length;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Checklist de progresso</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">{doneCount}/{items.length} etapas concluídas</p>
        </div>
        <div className="h-2 w-44 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 rounded-xl border border-parchment bg-stone-50/70 p-3 dark:border-white/10 dark:bg-white/5">
            {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />}
            <div>
              <p className="text-sm font-bold text-charcoal dark:text-white">{item.label}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{item.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MetricGrid({ metrics }: { metrics: CampaignMetrics }) {
  const items = [
    ["Total", metrics.total],
    ["Verificados", metrics.verified],
    ["Contatos", metrics.contacted],
    ["Respostas", metrics.responses],
    ["Reuniões", metrics.meetings],
    ["Propostas", metrics.proposals],
    ["Fechamentos", metrics.closed]
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
      {items.map(([label, value]) => (
        <Card key={label} className="p-4">
          <p className="text-2xl font-bold text-charcoal dark:text-white">{value}</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</p>
        </Card>
      ))}
    </div>
  );
}
