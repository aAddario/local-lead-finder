"use client";

import { useEffect, useState } from "react";
import { LeadList } from "@/components/lead-list";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRows } from "@/components/skeleton";
import { Card } from "@/components/ui/card";
import { fetchJson } from "@/lib/api";
import type { Lead } from "@/types/lead";

export default function LeadsPage() {
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
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Leads salvos</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
          Prospects priorizados.
        </h1>
      </section>
      {loading && <Card className="p-6"><SkeletonRows /></Card>}
      {error && <EmptyState title="Não foi possível carregar leads" text={error} />}
      {!loading && !error && leads.length === 0 && <EmptyState title="Nenhum lead salvo" text="Faça uma busca e salve empresas promissoras." />}
      {!loading && leads.length > 0 && <LeadList leads={leads} editable onChange={setLeads} />}
    </div>
  );
}
