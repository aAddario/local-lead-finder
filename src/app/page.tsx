import Link from "next/link";
import { ArrowRight, Download, Flag, MapPin, Phone, Radar, Search, Send, Table2, Target, Trophy, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/score-badge";
import { dashboardStats, listLeads, listSearches } from "@/lib/db";
import type { Lead } from "@/types/lead";

export default function DashboardPage() {
  const leads = listLeads();
  const searches = listSearches();
  const stats = dashboardStats();
  const topCategories = getTopCounts(leads, (lead) => lead.category, 8);
  const topCities = getTopCounts(leads, (lead) => lead.city ?? "Cidade desconhecida", 8);
  const statusCounts = getTopCounts(leads, (lead) => lead.status, 12);
  const scoreCounts = [
    { label: "80-100", count: leads.filter((lead) => lead.score >= 80).length },
    { label: "60-79", count: leads.filter((lead) => lead.score >= 60 && lead.score < 80).length },
    { label: "40-59", count: leads.filter((lead) => lead.score >= 40 && lead.score < 60).length },
    { label: "0-39", count: leads.filter((lead) => lead.score < 40).length }
  ];

  const metrics = [
    { label: "Total", value: stats.total, hint: "leads salvos", icon: Table2 },
    { label: "Sem site", value: stats.noSite, hint: "alta prioridade", icon: Target },
    { label: "Site ruim", value: stats.badSite, hint: "oportunidade", icon: Radar },
    { label: "Ótimos", value: stats.great, hint: "score 80+", icon: Trophy },
    { label: "Verificados", value: stats.verified, hint: "manual", icon: Workflow },
    { label: "Contatos", value: stats.contacted, hint: "enviados", icon: Send },
    { label: "Respostas", value: stats.responded, hint: `${stats.responseRate}%`, icon: Phone },
    { label: "Propostas", value: stats.proposals, hint: "pipeline", icon: Flag },
    { label: "Fechados", value: stats.closed, hint: "ganhos", icon: Target },
    { label: "Valor aberto", value: formatCurrency(stats.openEstimatedValue), hint: "estimado", icon: Trophy }
  ];

  return (
    <div className="space-y-0">
      <section className="relative w-full overflow-hidden bg-mysteria">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-lavender/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-lavender backdrop-blur-sm">
                <Radar className="h-4 w-4" />
                Máquina de prospecção local
              </span>
              <h1 className="text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl">
                Leads, validação, CRM e campanhas.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/70 md:text-xl">
                Priorize empresas sem presença digital clara, valide rápido e mova cada oportunidade até proposta.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/search" className="no-underline"><Button variant="cream"><Search className="h-4 w-4" />Nova busca</Button></Link>
              <Link href="/campaigns" className="no-underline"><Button variant="ghost" className="text-white hover:bg-white/10"><Flag className="h-4 w-4" />Campanhas</Button></Link>
              <a href="/api/export?scope=all" className="no-underline"><Button variant="ghost" className="text-white hover:bg-white/10"><Download className="h-4 w-4" />CSV</Button></a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="metric-tile p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">{metric.label}</p>
                  <Icon className="h-4 w-4 text-stone-400" />
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-charcoal dark:text-white">{metric.value}</p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{metric.hint}</p>
              </Card>
            );
          })}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Fila de oportunidade</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Ordenado por score. Valide primeiro os sem site e score alto.</p>
              </div>
              <Link href="/leads" className="no-underline"><Button variant="cream" size="sm"><ArrowRight className="h-4 w-4" />Abrir</Button></Link>
            </div>
            <div className="divide-y divide-parchment dark:divide-white/10">
              {leads.length === 0 && (
                <div className="py-10 text-center">
                  <p className="font-bold text-charcoal dark:text-white">Nenhum lead salvo ainda</p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Faça uma busca e salve empresas que vale a pena verificar.</p>
                </div>
              )}
              {leads.slice(0, 8).map((lead) => (
                <div key={lead.id} className="grid gap-3 py-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-stone-400" />
                      <p className="truncate font-bold text-charcoal dark:text-white">{lead.name}</p>
                    </div>
                    <p className="mt-1 truncate text-sm text-stone-500 dark:text-stone-400">
                      {lead.category} · {lead.city ?? "Cidade desconhecida"} · {lead.scoreExplanation}
                    </p>
                  </div>
                  <ScoreBadge score={lead.score} label={lead.scoreLabel} />
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6">
            <ExportPanel />
            <RecentSearches searches={searches} />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-4">
          <ChartCard title="Leads por status" data={statusCounts} />
          <ChartCard title="Leads por nicho" data={topCategories} />
          <ChartCard title="Leads por cidade" data={topCities} />
          <ChartCard title="Leads por score" data={scoreCounts} />
        </section>
      </div>
    </div>
  );
}

function ExportPanel() {
  const exports = [
    ["Todos", "/api/export?scope=all"],
    ["Ótimos", "/api/export?scope=great"],
    ["Sem site", "/api/export?scope=no_site"],
    ["Verificados", "/api/export?scope=verified"]
  ];
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Exportação</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {exports.map(([label, href]) => (
          <a key={href} href={href} className="no-underline">
            <Button variant="cream" className="w-full">
              <Download className="h-4 w-4" />
              {label}
            </Button>
          </a>
        ))}
      </div>
    </Card>
  );
}

function RecentSearches({ searches }: { searches: ReturnType<typeof listSearches> }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Buscas recentes</h2>
      <div className="mt-4 divide-y divide-parchment dark:divide-white/10">
        {searches.length === 0 && <p className="py-4 text-sm text-stone-500 dark:text-stone-400">Nenhuma busca ainda.</p>}
        {searches.slice(0, 5).map((search) => (
          <div key={search.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-bold text-charcoal dark:text-white">{search.location}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{search.radiusKm}km · {search.categories.length || "todas"} categorias</p>
            </div>
            <span className="rounded-lg bg-warm-cream px-2.5 py-1 text-xs font-bold text-charcoal dark:bg-white/10 dark:text-white">{search.resultCount}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ChartCard({ title, data }: { title: string; data: Array<{ label: string; count: number }> }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">{title}</h2>
      <div className="mt-5 space-y-4">
        {data.length === 0 && <p className="text-sm text-stone-500 dark:text-stone-400">Sem dados ainda.</p>}
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1.5 flex justify-between gap-3 text-sm font-semibold">
              <span className="truncate text-charcoal dark:text-white">{item.label}</span>
              <span className="text-stone-500">{item.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-lavender" style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function getTopCounts(leads: Lead[], selector: (lead: Lead) => string, limit: number) {
  const counts = new Map<string, number>();
  for (const lead of leads) counts.set(selector(lead), (counts.get(selector(lead)) ?? 0) + 1);
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}
