"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, CheckSquare, History, Save, Square } from "lucide-react";
import { ActionFeedback } from "@/components/action-feedback";
import { EmptyState } from "@/components/empty-state";
import { LeadCard } from "@/components/lead-card";
import { SkeletonRows } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchJson } from "@/lib/api";
import { suggestCampaignFromLeads } from "@/lib/campaign-suggestions";
import type { Campaign, CampaignMetrics, Lead, SearchRunDetail } from "@/types/lead";

export default function SearchDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [search, setSearch] = useState<SearchRunDetail | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async function loadSearch() {
    setError("");
    fetchJson<{ search: SearchRunDetail }>(`/api/searches/${id}`)
      .then((data) => {
        setSearch(data.search);
        setSelectedIds([]);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id, load]);

  const savedIds = useMemo(() => new Set(search?.savedLeadIds ?? []), [search]);
  const selectedUnsavedCount = useMemo(() => selectedIds.filter((leadId) => !savedIds.has(leadId)).length, [savedIds, selectedIds]);

  function toggleLead(leadId: string) {
    setSelectedIds((current) => (current.includes(leadId) ? current.filter((id) => id !== leadId) : [...current, leadId]));
  }

  function selectAll() {
    if (!search) return;
    setSelectedIds(search.leads.map((lead) => lead.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function saveSelectedLeads() {
    if (!search || selectedIds.length === 0) return;
    setSaving(true);
    setFeedback(null);
    try {
      const updatedLeads = [...search.leads];
      const savedLeadIds = new Set(search.savedLeadIds);
      let savedCount = 0;

      for (const leadId of selectedIds) {
        if (savedLeadIds.has(leadId)) continue;
        const index = updatedLeads.findIndex((lead) => lead.id === leadId);
        if (index === -1) continue;
        const data = await fetchJson<{ lead: Lead }>("/api/leads", { method: "POST", body: JSON.stringify(updatedLeads[index]) });
        updatedLeads[index] = data.lead;
        savedLeadIds.add(data.lead.id);
        savedCount += 1;
      }

      setSearch({ ...search, leads: updatedLeads, savedLeadIds: Array.from(savedLeadIds) });
      setFeedback({ tone: "success", message: savedCount > 0 ? `${savedCount} leads salvos.` : "Selecionados já estavam salvos." });
    } catch (err) {
      setFeedback({ tone: "error", message: err instanceof Error ? err.message : "Falha ao salvar selecionados." });
    } finally {
      setSaving(false);
    }
  }

  async function createCampaignFromSelected() {
    if (!search || selectedIds.length === 0) return;
    setCreatingCampaign(true);
    setFeedback(null);
    try {
      const leadIds = await ensureSelectedSaved(search);
      const suggestion = suggestCampaignFromLeads(search.leads.filter((lead) => selectedIds.includes(lead.id)), search.location);
      const data = await fetchJson<{ campaign: Campaign; metrics: CampaignMetrics }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({ ...suggestion, leadIds })
      });
      router.push(`/campaigns/${data.campaign.id}`);
    } catch (err) {
      setFeedback({ tone: "error", message: err instanceof Error ? err.message : "Falha ao criar campanha." });
    } finally {
      setCreatingCampaign(false);
    }
  }

  async function ensureSelectedSaved(currentSearch: SearchRunDetail) {
    const updatedLeads = [...currentSearch.leads];
    const savedLeadIds = new Set(currentSearch.savedLeadIds);
    const finalIds: string[] = [];

    for (const leadId of selectedIds) {
      const index = updatedLeads.findIndex((lead) => lead.id === leadId);
      if (index === -1) continue;
      if (!savedLeadIds.has(leadId)) {
        const data = await fetchJson<{ lead: Lead }>("/api/leads", { method: "POST", body: JSON.stringify(updatedLeads[index]) });
        updatedLeads[index] = data.lead;
        savedLeadIds.add(data.lead.id);
      }
      finalIds.push(leadId);
    }

    setSearch({ ...currentSearch, leads: updatedLeads, savedLeadIds: Array.from(savedLeadIds) });
    return finalIds;
  }

  if (error) return <div className="mx-auto max-w-7xl px-6 py-10"><EmptyState title="Busca não encontrada" text={error} /></div>;
  if (!search) return <div className="mx-auto max-w-7xl px-6 py-10"><Card className="p-6"><SkeletonRows /></Card></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/searches" className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 no-underline hover:text-charcoal dark:text-stone-400 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Buscas salvas
          </Link>
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <History className="h-4 w-4" />
            Busca arquivada
          </p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">{search.location}</h1>
          <p className="mt-2 max-w-3xl text-sm text-stone-500 dark:text-stone-400">{search.geo.label}</p>
        </div>
      </section>

      <Card className="p-5 shadow-tight">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <Pill>{search.resultCount} leads</Pill>
            <Pill>{search.radiusKm}km</Pill>
            <Pill>{search.categories.length || "todas"} categorias</Pill>
            <Pill>{selectedIds.length} selecionados</Pill>
            <Pill>{search.savedLeadIds.length} salvos</Pill>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={selectAll}>
              <CheckSquare className="h-4 w-4" />
              Todos
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearSelection}>
              <Square className="h-4 w-4" />
              Limpar
            </Button>
            <Button type="button" size="sm" variant="cream" onClick={saveSelectedLeads} disabled={selectedIds.length === 0 || saving}>
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : selectedUnsavedCount === 0 ? "Salvar selecionados" : `Salvar ${selectedUnsavedCount}`}
            </Button>
            <Button type="button" size="sm" variant="dark" onClick={createCampaignFromSelected} disabled={selectedIds.length === 0 || creatingCampaign}>
              <Briefcase className="h-4 w-4" />
              {creatingCampaign ? "Criando..." : "Criar campanha"}
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <ActionFeedback message={feedback?.message ?? null} tone={feedback?.tone ?? "success"} />
        </div>
      </Card>

      {search.leads.length === 0 ? (
        <EmptyState title="Busca sem resultados" text="Este registro não guardou resultados." />
      ) : (
        <div className="space-y-4">
          {search.leads.map((lead) => (
            <div key={lead.id} className="grid gap-3 rounded-2xl border border-parchment bg-white p-3 dark:border-white/10 dark:bg-[#12101f] md:grid-cols-[auto_1fr]">
              <label className="flex items-start gap-2 pt-2 text-sm font-bold text-stone-600 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(lead.id)}
                  onChange={() => toggleLead(lead.id)}
                  className="mt-1 h-4 w-4 rounded border-parchment text-charcoal focus:ring-charcoal"
                />
                Selecionar
              </label>
              <LeadCard
                lead={lead}
                persisted={savedIds.has(lead.id)}
                onPersisted={(updated) => {
                  setSearch((current) =>
                    current
                      ? {
                          ...current,
                          leads: current.leads.map((item) => (item.id === updated.id ? updated : item)),
                          savedLeadIds: current.savedLeadIds.includes(updated.id) ? current.savedLeadIds : [...current.savedLeadIds, updated.id]
                        }
                      : current
                  );
                }}
                onChange={(updated) => {
                  setSearch((current) => current ? { ...current, leads: current.leads.map((item) => (item.id === updated.id ? updated : item)) } : current);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-lg bg-stone-100 px-2.5 py-1 dark:bg-white/10">{children}</span>;
}
