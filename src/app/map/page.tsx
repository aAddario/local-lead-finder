"use client";

import { useEffect, useState } from "react";
import { LeadMap } from "@/components/lead-map";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { fetchJson } from "@/lib/api";
import type { Lead } from "@/types/lead";

export default function MapPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<{ leads: Lead[] }>("/api/leads")
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Mapa de leads</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
          Leads salvos por score de oportunidade.
        </h1>
      </section>
      {loading && <Card className="h-[580px] animate-pulse bg-stone-100 dark:bg-white/5" />}
      {error && <EmptyState title="Mapa indisponível" text={error} />}
      {!loading && !error && leads.length === 0 && <EmptyState title="Nenhum pin ainda" text="Salve leads da busca primeiro." />}
      {!loading && leads.length > 0 && <LeadMap leads={leads} />}
    </div>
  );
}
