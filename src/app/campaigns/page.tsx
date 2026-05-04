"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Flag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import type { Campaign, CampaignMetrics } from "@/types/lead";

type CampaignWithMetrics = Campaign & { metrics: CampaignMetrics };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "Clínicas em Natal",
    city: "Natal",
    niche: "Clínicas",
    objective: "Validar negócios sem site e enviar proposta simples",
    primaryOffer: "Landing page + WhatsApp"
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    fetchJson<{ campaigns: CampaignWithMetrics[] }>("/api/campaigns")
      .then((data) => setCampaigns(data.campaigns))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function createCampaign(event: React.FormEvent) {
    event.preventDefault();
    const data = await fetchJson<{ campaign: Campaign; metrics: CampaignMetrics }>("/api/campaigns", { method: "POST", body: JSON.stringify({ ...form, leadIds: [] }) });
    setCampaigns((current) => [{ ...data.campaign, metrics: data.metrics }, ...current]);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <Flag className="h-4 w-4" />
            Campanhas
          </p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
            Agrupe leads por cidade, nicho e oferta.
          </h1>
        </div>
        <a href="/api/export?scope=great" className="no-underline">
          <Button variant="cream">Exportar ótimos leads</Button>
        </a>
      </section>

      <Card className="p-6 shadow-tight">
        <form onSubmit={createCampaign} className="grid gap-3 lg:grid-cols-[1fr_150px_150px_1fr_1fr_auto] lg:items-end">
          <Field label="Nome" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          <Field label="Cidade" value={form.city} onChange={(value) => setForm((current) => ({ ...current, city: value }))} />
          <Field label="Nicho" value={form.niche} onChange={(value) => setForm((current) => ({ ...current, niche: value }))} />
          <Field label="Objetivo" value={form.objective} onChange={(value) => setForm((current) => ({ ...current, objective: value }))} />
          <Field label="Oferta" value={form.primaryOffer} onChange={(value) => setForm((current) => ({ ...current, primaryOffer: value }))} />
          <Button variant="dark">
            <Plus className="h-4 w-4" />
            Criar
          </Button>
        </form>
      </Card>

      {loading && <Card className="h-40 animate-pulse bg-stone-100 dark:bg-white/5" />}
      {error && <Card className="p-6 text-sm font-semibold text-red-600 dark:text-red-300">{error}</Card>}
      {!loading && campaigns.length === 0 && (
        <Card className="p-10 text-center">
          <p className="font-bold text-charcoal dark:text-white">Nenhuma campanha ainda.</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Crie uma campanha para organizar validação, contato e propostas.</p>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-charcoal dark:text-white">{campaign.name}</h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{campaign.city} · {campaign.niche} · {campaign.primaryOffer}</p>
              </div>
              <Link href={`/campaigns/${campaign.id}`} className="no-underline">
                <Button size="sm" variant="cream">
                  Abrir
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <MetricGrid metrics={campaign.metrics} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
      {label}
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="text-sm normal-case tracking-normal" />
    </label>
  );
}

function MetricGrid({ metrics }: { metrics: CampaignMetrics }) {
  const items = [
    ["Leads", metrics.total],
    ["Verificados", metrics.verified],
    ["Contatos", metrics.contacted],
    ["Respostas", metrics.responses],
    ["Reuniões", metrics.meetings],
    ["Propostas", metrics.proposals],
    ["Fechados", metrics.closed]
  ];
  return (
    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl bg-stone-50 p-3 dark:bg-white/5">
          <p className="text-lg font-bold text-charcoal dark:text-white">{value}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
