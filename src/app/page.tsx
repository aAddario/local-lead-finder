import Link from "next/link";
import { ArrowRight, Download, MapPin, Phone, Radar, Search, Table2, Target, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/score-badge";
import { dashboardStats, listLeads, listSearches } from "@/lib/db";

export default function DashboardPage() {
  const leads = listLeads();
  const searches = listSearches();
  const stats = dashboardStats();
  const topCategories = getTopCategories(leads);

  const metrics = [
    { label: "Salvos", value: stats.total, hint: "leads", icon: Table2 },
    { label: "Sem site", value: stats.noSite, hint: "verificar primeiro", icon: Target },
    { label: "Telefone", value: stats.withPhone, hint: "contatável", icon: Phone },
    { label: "Ótimos", value: stats.great, hint: "score 80+", icon: Radar },
    { label: "Contatados", value: stats.contacted, hint: "ativos", icon: Workflow },
    { label: "Fechados", value: stats.closed, hint: "ganhos", icon: Target },
    { label: "Resposta", value: `${stats.responseRate}%`, hint: "taxa", icon: ArrowRight }
  ];

  return (
    <div className="space-y-0">
      {/* Hero — full width edge to edge */}
      <section className="relative w-full overflow-hidden bg-mysteria">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-lavender/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-lavender backdrop-blur-sm">
                <Radar className="h-4 w-4" />
                Dashboard
              </span>
              <h1 className="text-4xl font-medium tracking-tight text-white md:text-5xl lg:text-6xl">
                Operações de leads
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-white/70 md:text-xl">
                Escaneie empresas locais, salve oportunidades promissoras e acompanhe os contatos em uma única visão.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/search" className="no-underline">
                <Button variant="cream">
                  <Search className="h-4 w-4" />
                  Nova busca
                </Button>
              </Link>
              <Link href="/leads" className="no-underline">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Table2 className="h-4 w-4" />
                  Leads
                </Button>
              </Link>
              <a href="/api/export" className="no-underline">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Content container */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Metrics */}
        <section className="grid gap-4 md:grid-cols-7">
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

        {/* Main grid */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Fila de leads salvos</h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">Ordenado por oportunidade. Verifique manualmente antes do contato.</p>
              </div>
              <Link href="/leads" className="no-underline">
                <Button variant="cream" size="sm">
                  <ArrowRight className="h-4 w-4" />
                  Abrir
                </Button>
              </Link>
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
                      {lead.category} · {lead.city ?? "Cidade desconhecida"} · {lead.scoreReasons.slice(0, 2).join(" · ")}
                    </p>
                  </div>
                  <ScoreBadge score={lead.score} label={lead.scoreLabel} />
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Sinal por categoria</h2>
              <div className="mt-5 space-y-4">
                {topCategories.length === 0 && <p className="text-sm text-stone-500 dark:text-stone-400">Nenhuma categoria salva ainda.</p>}
                {topCategories.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1.5 flex justify-between gap-3 text-sm font-semibold">
                      <span className="truncate text-charcoal dark:text-white">{item.category}</span>
                      <span className="text-stone-500">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-lavender"
                        style={{ width: `${Math.max(10, Math.min(100, item.count * 14))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

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
          </div>
        </section>
      </div>
    </div>
  );
}

function getTopCategories(leads: ReturnType<typeof listLeads>) {
  const categories = new Map<string, number>();
  for (const lead of leads.filter((item) => item.score >= 60)) {
    categories.set(lead.category, (categories.get(lead.category) ?? 0) + 1);
  }
  return Array.from(categories.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
