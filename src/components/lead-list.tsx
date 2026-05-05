"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, CheckCircle2, CheckSquare, Download, Flag, Save, Search, ShieldCheck, SlidersHorizontal, Square, Trash2 } from "lucide-react";
import { ActionFeedback } from "@/components/action-feedback";
import { LeadCard } from "@/components/lead-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { fetchJson } from "@/lib/api";
import { suggestCampaignFromLeads } from "@/lib/campaign-suggestions";
import { leadsToCsv } from "@/lib/csv";
import { leadStatuses, type Campaign, type Lead, type LeadStatus } from "@/types/lead";

type LeadListProps = {
  leads: Lead[];
  editable?: boolean;
  persistedLeadIds?: string[];
  allowCreateCampaignFromVisible?: boolean;
  onChange?: (leads: Lead[]) => void;
  onLeadSaved?: (lead: Lead) => void;
};

type SortMode = "score" | "updated" | "name" | "city";
type BulkAction = "save" | "campaign" | "create-campaign" | "verified" | "discard" | null;

export function LeadList({ leads, editable = false, persistedLeadIds = [], allowCreateCampaignFromVisible = false, onChange, onLeadSaved }: LeadListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [scoreFloor, setScoreFloor] = useState(0);
  const [sortBy, setSortBy] = useState<SortMode>("score");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkSavedCount, setBulkSavedCount] = useState(0);
  const [bulkError, setBulkError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [bulkMessage, setBulkMessage] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const persistedIds = useMemo(() => new Set(persistedLeadIds), [persistedLeadIds]);

  useEffect(() => {
    fetchJson<{ campaigns: Campaign[] }>("/api/campaigns")
      .then((data) => {
        setCampaigns(data.campaigns);
        setSelectedCampaignId((current) => current || data.campaigns[0]?.id || "");
      })
      .catch(() => undefined);
  }, []);

  const stats = useMemo(
    () => ({
      total: leads.length,
      strong: leads.filter((lead) => lead.score >= 80).length,
      noWebsite: leads.filter((lead) => !lead.website).length,
      withPhone: leads.filter((lead) => Boolean(lead.phone)).length
    }),
    [leads]
  );

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return leads
      .filter((lead) => {
        const matchesText =
          !term ||
          lead.name.toLowerCase().includes(term) ||
          lead.category.toLowerCase().includes(term) ||
          (lead.city ?? "").toLowerCase().includes(term) ||
          (lead.phone ?? "").toLowerCase().includes(term) ||
          lead.status.toLowerCase().includes(term) ||
          lead.notes.toLowerCase().includes(term);
        const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
        return matchesText && matchesStatus && lead.score >= scoreFloor;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "city") return (a.city ?? "").localeCompare(b.city ?? "") || b.score - a.score;
        if (sortBy === "updated") return b.updatedAt.localeCompare(a.updatedAt);
        return b.score - a.score;
      });
  }, [filter, leads, scoreFloor, sortBy, statusFilter]);

  const visibleSavedCount = useMemo(() => filtered.filter((lead) => editable || persistedIds.has(lead.id)).length, [editable, filtered, persistedIds]);
  const unsavedVisible = useMemo(() => filtered.filter((lead) => !editable && !persistedIds.has(lead.id)), [editable, filtered, persistedIds]);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedLeads = useMemo(() => leads.filter((lead) => selectedIdSet.has(lead.id)), [leads, selectedIdSet]);
  const selectedUnsavedCount = useMemo(() => selectedLeads.filter((lead) => !editable && !persistedIds.has(lead.id)).length, [editable, persistedIds, selectedLeads]);
  const visibleSelectedCount = useMemo(() => filtered.filter((lead) => selectedIdSet.has(lead.id)).length, [filtered, selectedIdSet]);

  function isPersisted(leadId: string) {
    return editable || persistedIds.has(leadId);
  }

  function exportCsv() {
    downloadCsv(filtered, "leads-locais.csv");
  }

  function exportSelectedCsv() {
    downloadCsv(selectedLeads, "leads-selecionados.csv");
  }

  function downloadCsv(items: Lead[], filename: string) {
    const csv = leadsToCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function selectVisibleLeads() {
    setSelectedIds((current) => Array.from(new Set([...current, ...filtered.map((lead) => lead.id)])));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function toggleSelected(leadId: string) {
    setSelectedIds((current) => (current.includes(leadId) ? current.filter((id) => id !== leadId) : [...current, leadId]));
  }

  async function saveVisibleLeads() {
    setBulkSaving(true);
    setBulkSavedCount(0);
    setBulkError("");
    try {
      let saved = 0;
      let nextLeads = leads;
      for (const lead of unsavedVisible) {
        const data = await fetchJson<{ lead: Lead }>("/api/leads", { method: "POST", body: JSON.stringify(lead) });
        nextLeads = nextLeads.map((item) => (item.id === lead.id ? data.lead : item));
        saved += 1;
        setBulkSavedCount(saved);
        onLeadSaved?.(data.lead);
        onChange?.(nextLeads);
      }
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Falha ao salvar visíveis.");
    } finally {
      setBulkSaving(false);
    }
  }

  async function saveSelectedLeads() {
    if (selectedLeads.length === 0) return;
    setBulkAction("save");
    setBulkMessage("");
    setBulkError("");
    try {
      const result = await ensurePersisted(selectedLeads);
      onChange?.(result.leads);
      setBulkSavedCount(result.savedCount);
      setBulkMessage(result.savedCount > 0 ? `${result.savedCount} leads salvos.` : "Selecionados já estavam salvos.");
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Falha ao salvar selecionados.");
    } finally {
      setBulkAction(null);
    }
  }

  async function addSelectedToCampaign() {
    if (selectedLeads.length === 0 || !selectedCampaignId) return;
    setBulkAction("campaign");
    setBulkMessage("");
    setBulkError("");
    try {
      const result = await ensurePersisted(selectedLeads);
      const campaign = campaigns.find((item) => item.id === selectedCampaignId);
      if (!campaign) throw new Error("Campanha não encontrada.");
      const leadIds = Array.from(new Set([...campaign.leadIds, ...result.targetLeads.map((lead) => lead.id)]));
      const data = await fetchJson<{ campaign: Campaign }>(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        body: JSON.stringify({ leadIds })
      });
      setCampaigns((current) => current.map((item) => (item.id === data.campaign.id ? { ...item, leadIds: data.campaign.leadIds } : item)));
      onChange?.(result.leads);
      setBulkMessage(`${result.targetLeads.length} leads vinculados em ${data.campaign.name}.`);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Falha ao adicionar à campanha.");
    } finally {
      setBulkAction(null);
    }
  }

  async function createCampaignFromVisible() {
    if (filtered.length === 0) return;
    setBulkAction("create-campaign");
    setBulkMessage("");
    setBulkError("");
    try {
      const result = await ensurePersisted(filtered);
      const suggestion = suggestCampaignFromLeads(result.targetLeads);
      const data = await fetchJson<{ campaign: Campaign }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({ ...suggestion, leadIds: result.targetLeads.map((lead) => lead.id) })
      });
      onChange?.(result.leads);
      setBulkMessage(`Campanha criada: ${data.campaign.name}.`);
      router.push(`/campaigns/${data.campaign.id}`);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Falha ao criar campanha.");
    } finally {
      setBulkAction(null);
    }
  }

  async function markSelectedVerified() {
    await patchSelectedLeads("verified", {
      validationStatus: "verified",
      status: "Verificado",
      lastCheckedAt: new Date().toISOString()
    });
  }

  async function discardSelectedLeads() {
    await patchSelectedLeads("discard", {
      validationStatus: "discarded",
      status: "Descartado",
      lastCheckedAt: new Date().toISOString()
    });
  }

  async function patchSelectedLeads(action: "verified" | "discard", patch: Partial<Lead>) {
    if (selectedLeads.length === 0) return;
    setBulkAction(action);
    setBulkMessage("");
    setBulkError("");
    try {
      const result = await ensurePersisted(selectedLeads);
      let nextLeads = result.leads;
      let updatedCount = 0;
      for (const lead of result.targetLeads) {
        const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        nextLeads = nextLeads.map((item) => (item.id === data.lead.id ? data.lead : item));
        updatedCount += 1;
      }
      onChange?.(nextLeads);
      setBulkMessage(action === "verified" ? `${updatedCount} leads marcados como verificados.` : `${updatedCount} leads descartados.`);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Falha na ação em lote.");
    } finally {
      setBulkAction(null);
    }
  }

  async function ensurePersisted(targetLeads: Lead[]) {
    let nextLeads = leads;
    let savedCount = 0;
    const savedNow = new Set<string>();

    for (const lead of targetLeads) {
      if (isPersisted(lead.id) || savedNow.has(lead.id)) continue;
      const data = await fetchJson<{ lead: Lead }>("/api/leads", { method: "POST", body: JSON.stringify(lead) });
      nextLeads = nextLeads.map((item) => (item.id === data.lead.id ? data.lead : item));
      savedNow.add(data.lead.id);
      savedCount += 1;
      onLeadSaved?.(data.lead);
    }

    const nextById = new Map(nextLeads.map((lead) => [lead.id, lead]));
    return {
      leads: nextLeads,
      targetLeads: targetLeads.map((lead) => nextById.get(lead.id) ?? lead),
      savedCount
    };
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-parchment bg-white p-4 shadow-tight dark:border-white/10 dark:bg-[#12101f]">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_150px_150px_auto_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              placeholder="Filtrar por nome, cidade, telefone, status..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="pl-9"
            />
          </label>

          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | "all")}>
            <option value="all">Todos status</option>
            {leadStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <Select value={scoreFloor} onChange={(event) => setScoreFloor(Number(event.target.value))}>
            <option value={0}>Score 0+</option>
            <option value={40}>Score 40+</option>
            <option value={60}>Score 60+</option>
            <option value={80}>Score 80+</option>
          </Select>

          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortMode)}>
            <option value="score">Maior score</option>
            <option value="updated">Atualizados</option>
            <option value="name">Nome A-Z</option>
            <option value="city">Cidade</option>
          </Select>

          <Button variant="cream" onClick={exportCsv} className="shrink-0" disabled={filtered.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            CSV
          </Button>

          {!editable && (
            <Button onClick={saveVisibleLeads} className="shrink-0" disabled={unsavedVisible.length === 0 || bulkSaving}>
              <Save className="mr-1.5 h-4 w-4" />
              {bulkSaving ? "Salvando..." : unsavedVisible.length === 0 ? "Todos salvos" : `Salvar ${unsavedVisible.length}`}
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 dark:bg-white/10">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {filtered.length}/{stats.total} visiveis
          </span>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{stats.strong} score 80+</span>
          <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{stats.noWebsite} sem site</span>
          <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{stats.withPhone} com telefone</span>
          {!editable && visibleSavedCount > 0 && (
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{visibleSavedCount} salvos</span>
          )}
          {!editable && bulkSavedCount > 0 && (
            <span className="rounded-lg bg-lavender/10 px-2.5 py-1 text-amethyst dark:bg-lavender/20 dark:text-lavender">{bulkSavedCount} salvos agora</span>
          )}
          {selectedIds.length > 0 && (
            <span className="rounded-lg bg-charcoal px-2.5 py-1 text-white dark:bg-white dark:text-[#0d0b1e]">{selectedIds.length} selecionados</span>
          )}
        </div>
        <div className="mt-4 rounded-xl border border-parchment bg-stone-50/70 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-2 lg:grid-cols-[auto_auto_1fr_auto_auto_auto_auto_auto] lg:items-center">
            <Button type="button" size="sm" variant="ghost" onClick={selectVisibleLeads} disabled={filtered.length === 0}>
              <CheckSquare className="h-4 w-4" />
              Selecionar visíveis
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearSelection} disabled={selectedIds.length === 0}>
              <Square className="h-4 w-4" />
              Limpar
            </Button>
            <Select value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)} className="h-8 text-xs">
              <option value="">Sem campanha</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </Select>
            <Button type="button" size="sm" variant="cream" onClick={saveSelectedLeads} disabled={selectedLeads.length === 0 || selectedUnsavedCount === 0 || bulkAction !== null}>
              <Save className="h-4 w-4" />
              {bulkAction === "save" ? "Salvando..." : selectedUnsavedCount === 0 ? "Salvos" : `Salvar ${selectedUnsavedCount}`}
            </Button>
            <Button type="button" size="sm" variant="cream" onClick={addSelectedToCampaign} disabled={selectedLeads.length === 0 || !selectedCampaignId || bulkAction !== null}>
              <Flag className="h-4 w-4" />
              Campanha
            </Button>
            <Button type="button" size="sm" variant="cream" onClick={markSelectedVerified} disabled={selectedLeads.length === 0 || bulkAction !== null}>
              <ShieldCheck className="h-4 w-4" />
              Verificar
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={discardSelectedLeads} disabled={selectedLeads.length === 0 || bulkAction !== null}>
              <Trash2 className="h-4 w-4" />
              Descartar
            </Button>
            <Button type="button" size="sm" variant="cream" onClick={exportSelectedCsv} disabled={selectedLeads.length === 0}>
              <Download className="h-4 w-4" />
              CSV sel.
            </Button>
          </div>
          {allowCreateCampaignFromVisible && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-parchment pt-3 dark:border-white/10">
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Campanha sugerida: {suggestCampaignFromLeads(filtered).name}
              </p>
              <Button type="button" size="sm" variant="dark" onClick={createCampaignFromVisible} disabled={filtered.length === 0 || bulkAction !== null}>
                <Briefcase className="h-4 w-4" />
                {bulkAction === "create-campaign" ? "Criando..." : "Criar campanha dos visíveis"}
              </Button>
            </div>
          )}
          {selectedIds.length > 0 && (
            <p className="mt-2 text-xs font-semibold text-stone-500 dark:text-stone-400">
              {visibleSelectedCount}/{filtered.length} visíveis selecionados.
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionFeedback message={bulkMessage || (bulkSavedCount > 0 ? `${bulkSavedCount} leads salvos.` : null)} />
          <ActionFeedback message={bulkError || null} tone="error" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum lead corresponde ao filtro.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((lead) => (
            <div key={lead.id} className="grid gap-3 md:grid-cols-[118px_1fr] md:items-start">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-parchment bg-white px-3 text-xs font-bold text-stone-600 shadow-tight dark:border-white/10 dark:bg-[#1a1630] dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={selectedIdSet.has(lead.id)}
                  onChange={() => toggleSelected(lead.id)}
                  className="h-4 w-4 rounded border-parchment text-charcoal focus:ring-charcoal"
                />
                {selectedIdSet.has(lead.id) ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Sel.
                  </span>
                ) : (
                  "Selecionar"
                )}
              </label>
              <LeadCard
                lead={lead}
                editable={editable}
                persisted={editable || persistedIds.has(lead.id)}
                onPersisted={onLeadSaved}
                onChange={(updated) => {
                  if (!onChange) return;
                  const next = leads.map((l) => (l.id === updated.id ? updated : l));
                  onChange(next);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
