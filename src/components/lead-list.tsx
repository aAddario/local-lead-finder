"use client";

import { useMemo, useState } from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import { LeadCard } from "@/components/lead-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { leadsToCsv } from "@/lib/csv";
import { leadStatuses, type Lead, type LeadStatus } from "@/types/lead";

type LeadListProps = {
  leads: Lead[];
  editable?: boolean;
  onChange?: (leads: Lead[]) => void;
};

type SortMode = "score" | "updated" | "name" | "city";

export function LeadList({ leads, editable = false, onChange }: LeadListProps) {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [scoreFloor, setScoreFloor] = useState(0);
  const [sortBy, setSortBy] = useState<SortMode>("score");

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

  function exportCsv() {
    const csv = leadsToCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "leads-locais.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-parchment bg-white p-4 shadow-tight dark:border-white/10 dark:bg-[#12101f]">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_150px_150px_auto] lg:items-center">
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
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 dark:bg-white/10">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {filtered.length}/{stats.total} visiveis
          </span>
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{stats.strong} score 80+</span>
          <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">{stats.noWebsite} sem site</span>
          <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{stats.withPhone} com telefone</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-stone-500 dark:text-stone-400">Nenhum lead corresponde ao filtro.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              editable={editable}
              onChange={(updated) => {
                if (!onChange) return;
                const next = leads.map((l) => (l.id === updated.id ? updated : l));
                onChange(next);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
