"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Plus, X } from "lucide-react";
import { LeadCard } from "@/components/lead-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import type { Campaign, CampaignMetrics, Lead } from "@/types/lead";

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

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Select value={selectedLeadId} onChange={(event) => setSelectedLeadId(event.target.value)}>
            <option value="">Selecionar lead para vincular</option>
            {leadOptions.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.city ?? "sem cidade"} · {lead.score}</option>)}
          </Select>
          <Button variant="dark" onClick={addLead} disabled={!selectedLeadId}>
            <Plus className="h-4 w-4" />
            Vincular lead
          </Button>
        </div>
      </Card>

      {data.leads.length === 0 ? (
        <Card className="p-10 text-center text-sm text-stone-500">Nenhum lead vinculado.</Card>
      ) : (
        <div className="space-y-4">
          {data.leads.map((lead) => (
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
