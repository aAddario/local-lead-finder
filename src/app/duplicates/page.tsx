"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CopyCheck, ExternalLink, ShieldAlert, Trash2 } from "lucide-react";
import { ActionFeedback } from "@/components/action-feedback";
import { EmptyState } from "@/components/empty-state";
import { ScoreBadge } from "@/components/score-badge";
import { SkeletonRows } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchJson } from "@/lib/api";
import { findDuplicateGroups } from "@/lib/data-quality";
import type { Lead } from "@/types/lead";

type Feedback = { message: string; tone: "success" | "error" } | null;

export default function DuplicatesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    fetchJson<{ leads: Lead[] }>("/api/leads")
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => findDuplicateGroups(leads.filter((lead) => lead.status !== "Descartado")), [leads]);

  async function discardLead(lead: Lead) {
    setBusyId(lead.id);
    setFeedback(null);
    try {
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Descartado",
          validationStatus: "discarded",
          notes: [lead.notes, "Possível duplicado descartado na revisão."].filter(Boolean).join("\n")
        })
      });
      setLeads((current) => current.map((item) => (item.id === data.lead.id ? data.lead : item)));
      setFeedback({ tone: "success", message: "Lead descartado como duplicado." });
    } catch (err) {
      setFeedback({ tone: "error", message: err instanceof Error ? err.message : "Falha ao descartar." });
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <CopyCheck className="h-4 w-4" />
            Duplicados
          </p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
            Revise empresas repetidas antes de campanhas e exportações.
          </h1>
        </div>
        <div className="rounded-xl bg-stone-100 px-4 py-3 text-center dark:bg-white/10">
          <p className="text-2xl font-bold text-charcoal dark:text-white">{groups.length}</p>
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">grupos</p>
        </div>
      </section>

      <ActionFeedback message={feedback?.message ?? null} tone={feedback?.tone ?? "success"} />

      {loading && <Card className="p-6"><SkeletonRows /></Card>}
      {error && <EmptyState title="Não foi possível carregar duplicados" text={error} />}
      {!loading && !error && groups.length === 0 && <EmptyState title="Nenhum duplicado provável" text="A base atual não tem grupos com telefone, e-mail, site ou localização repetidos." />}

      {!loading && !error && groups.length > 0 && (
        <div className="space-y-5">
          {groups.map((group) => (
            <Card key={group.id} className="p-5 shadow-tight">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-charcoal dark:text-white">
                    <ShieldAlert className="h-5 w-5 text-amber-500" />
                    {group.reason}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{group.leads.length} leads no grupo</p>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {group.leads.map((lead) => (
                  <div key={lead.id} className="rounded-xl border border-parchment bg-stone-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-charcoal dark:text-white">{lead.name}</h3>
                        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{lead.category} · {lead.city ?? "sem cidade"}</p>
                      </div>
                      <ScoreBadge score={lead.score} label={lead.scoreLabel} />
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-stone-600 dark:text-stone-300">
                      <span>{lead.phone ?? "Sem telefone"}</span>
                      <span>{lead.email ?? "Sem e-mail"}</span>
                      <span>{lead.website ?? "Sem site"}</span>
                      <span>Dados {lead.dataConfidenceScore}/100 · {lead.dataConfidenceLabel}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={`/leads/${lead.id}`} className="no-underline">
                        <Button size="sm" variant="cream"><ExternalLink className="h-4 w-4" />Abrir</Button>
                      </Link>
                      <Button size="sm" variant="danger" onClick={() => discardLead(lead)} disabled={busyId === lead.id}>
                        <Trash2 className="h-4 w-4" />
                        Descartar duplicado
                      </Button>
                      {lead.validationStatus === "verified" && <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"><CheckCircle2 className="h-3.5 w-3.5" />Verificado</span>}
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
