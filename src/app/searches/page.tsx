import Link from "next/link";
import { ArrowRight, History, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listSearches } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function SearchesPage() {
  const searches = listSearches();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <History className="h-4 w-4" />
            Buscas salvas
          </p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
            Reabra pesquisas, salve bons leads e transforme resultados em campanha.
          </h1>
        </div>
        <Link href="/search" className="no-underline">
          <Button variant="dark">
            <Search className="h-4 w-4" />
            Nova busca
          </Button>
        </Link>
      </section>

      {searches.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-bold text-charcoal dark:text-white">Nenhuma busca registrada.</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Execute uma busca para voltar aqui depois.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {searches.map((search) => (
            <Card key={search.id} className="p-6 shadow-tight">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold tracking-tight text-charcoal dark:text-white">{searchLocationTitle(search.location)}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{search.geo.label || search.location}</span>
                  </p>
                </div>
                <Link href={`/searches/${search.id}`} className="no-underline">
                  <Button size="sm" variant="cream">
                    Abrir
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <Metric label="Leads" value={search.resultCount} />
                <Metric label="Raio" value={`${search.radiusKm}km`} />
                <Metric label="Categorias" value={search.categories.length || "todas"} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
                {search.filters.noWebsiteOnly && <Chip>sem site</Chip>}
                {search.filters.withPhoneOnly && <Chip>com telefone</Chip>}
                {search.filters.ignoreFranchises && <Chip>sem franquias</Chip>}
                {search.filters.prioritizeHighTicket && <Chip>ticket alto</Chip>}
                <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-stone-500 dark:bg-white/10 dark:text-stone-300">{formatDate(search.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-stone-50 p-3 dark:bg-white/5">
      <p className="text-lg font-bold text-charcoal dark:text-white">{value}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-lg bg-lavender/10 px-2.5 py-1 text-amethyst dark:bg-lavender/20 dark:text-lavender">{children}</span>;
}

function searchLocationTitle(location: string) {
  return location.split(",")[0] || location;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
