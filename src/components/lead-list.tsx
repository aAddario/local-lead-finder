"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { LeadCard } from "@/components/lead-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { leadsToCsv } from "@/lib/csv";
import type { Lead } from "@/types/lead";

type LeadListProps = {
  leads: Lead[];
  editable?: boolean;
  onChange?: (leads: Lead[]) => void;
};

export function LeadList({ leads, editable = false, onChange }: LeadListProps) {
  const [filter, setFilter] = useState("");

  const filtered = leads.filter((lead) => {
    if (!filter.trim()) return true;
    const term = filter.toLowerCase();
    return (
      lead.name.toLowerCase().includes(term) ||
      lead.category.toLowerCase().includes(term) ||
      (lead.city ?? "").toLowerCase().includes(term) ||
      (lead.phone ?? "").toLowerCase().includes(term) ||
      lead.status.toLowerCase().includes(term) ||
      lead.notes.toLowerCase().includes(term)
    );
  });

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filtrar leads..."
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="sm:max-w-sm"
        />
        <Button variant="cream" onClick={exportCsv} className="shrink-0">
          <Download className="mr-1.5 h-4 w-4" />
          Exportar CSV
        </Button>
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
