"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { LeadActions } from "@/components/lead-actions";
import { ScoreBadge } from "@/components/score-badge";
import { StatusBadge } from "@/components/status-badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/api";
import { leadsToCsv } from "@/lib/csv";
import { leadStatuses, type Lead, type LeadStatus } from "@/types/lead";

export function LeadTable({ leads, editable = false, onChange }: { leads: Lead[]; editable?: boolean; onChange?: (leads: Lead[]) => void }) {
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState(leads);
  const [sorting, setSorting] = useState<SortingState>([{ id: "score", desc: true }]);

  useEffect(() => {
    setRows(leads);
  }, [leads]);

  const updateRow = (lead: Lead) => {
    const next = rows.map((item) => (item.id === lead.id ? lead : item));
    setRows(next);
    onChange?.(next);
  };

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      { header: "Score", accessorKey: "score", cell: ({ row }) => <ScoreBadge score={row.original.score} label={row.original.scoreLabel} /> },
      { header: "Nome", accessorKey: "name", cell: ({ row }) => <div><p className="font-bold text-charcoal dark:text-white">{row.original.name}</p><p className="text-xs text-stone-500 dark:text-stone-400">{row.original.scoreReasons.slice(0, 3).join(" · ")}</p></div> },
      { header: "Categoria", accessorKey: "category" },
      { header: "Telefone", accessorKey: "phone", cell: ({ row }) => row.original.phone ?? <span className="text-stone-400">Ausente</span> },
      { header: "Site", accessorKey: "website", cell: ({ row }) => row.original.website ? <a className="text-amethyst underline" href={row.original.website} target="_blank" rel="noreferrer noopener">Abrir</a> : <span className="text-stone-400">Possivelmente nenhum</span> },
      { header: "Cidade", accessorKey: "city" },
      { header: "Status", accessorKey: "status", cell: ({ row }) => editable ? <StatusEditor lead={row.original} onChange={updateRow} /> : <StatusBadge status={row.original.status} /> },
      { header: "Observações", accessorKey: "notes", cell: ({ row }) => editable ? <NotesEditor lead={row.original} onChange={updateRow} /> : <span className="text-sm text-stone-600 dark:text-stone-300">{row.original.notes}</span> },
      { header: "Ações", size: 420, cell: ({ row }) => <LeadActions lead={row.original} onSaved={updateRow} /> }
    ],
    [editable, rows]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter: filter, sorting },
    onGlobalFilterChange: setFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  function exportCurrentCsv() {
    const csv = leadsToCsv(table.getFilteredRowModel().rows.map((row) => row.original));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "leads-locais.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input placeholder="Filtrar leads..." value={filter} onChange={(event) => setFilter(event.target.value)} className="md:max-w-sm" />
        <Button variant="cream" onClick={exportCurrentCsv}>Exportar CSV</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-parchment dark:border-white/10">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead className="bg-stone-50 text-left dark:bg-white/5">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="border-b border-parchment px-4 py-3 text-xs font-bold uppercase tracking-wider text-stone-500 dark:border-white/10 dark:text-stone-400">
                    {header.column.getCanSort() ? (
                      <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 text-left">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowDownUp className="h-3.5 w-3.5 text-stone-400" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-parchment align-top transition hover:bg-stone-50/60 dark:border-white/5 dark:hover:bg-white/5">
                {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusEditor({ lead, onChange }: { lead: Lead; onChange: (lead: Lead) => void }) {
  async function update(status: LeadStatus) {
    const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    onChange(data.lead);
  }
  return (
    <Select value={lead.status} onChange={(event) => update(event.target.value as LeadStatus)}>
      {leadStatuses.map((status) => <option key={status}>{status}</option>)}
    </Select>
  );
}

function NotesEditor({ lead, onChange }: { lead: Lead; onChange: (lead: Lead) => void }) {
  const [notes, setNotes] = useState(lead.notes);
  async function save() {
    const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ notes }) });
    onChange(data.lead);
  }
  return <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={save} className="min-h-16 w-56" />;
}
