"use client";

import { useState } from "react";
import { AlertTriangle, CheckSquare, Search, Square } from "lucide-react";
import { LeadList } from "@/components/lead-list";
import { LeadMap } from "@/components/lead-map";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRows } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { categoryConfigs } from "@/lib/categories";
import { fetchJson } from "@/lib/api";
import type { Lead, LeadSearchRequest } from "@/types/lead";

type SearchResponse = { leads: Lead[]; geo: { label: string; lat: number; lng: number } };

export default function SearchPage() {
  const [location, setLocation] = useState("Patos PB");
  const [radiusKm, setRadiusKm] = useState(3);
  const [categories, setCategories] = useState<string[]>(["clinics", "dentists", "salons", "petshops", "offices"]);
  const [filters, setFilters] = useState({ noWebsiteOnly: true, withPhoneOnly: false, ignoreFranchises: true, prioritizeHighTicket: true });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [geoLabel, setGeoLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const payload: LeadSearchRequest = { location, radiusKm, categories, filters };
      const data = await fetchJson<SearchResponse>("/api/search", { method: "POST", body: JSON.stringify(payload) });
      setLeads(data.leads);
      setGeoLabel(data.geo.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na busca");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(id: string) {
    setCategories((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function selectAllCategories() {
    setCategories(categoryConfigs.map((category) => category.id));
  }

  function clearCategories() {
    setCategories([]);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Busca por área</p>
        <h1 className="mt-2 max-w-4xl text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
          Encontre leads por cidade, bairro, raio e categoria.
        </h1>
      </section>

      <Card className="p-6">
        <form onSubmit={submit} className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
            <label className="grid gap-2 text-sm font-semibold">
              Cidade ou bairro
              <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Patos PB, Natal RN, João Pessoa PB" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Raio
              <Select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}>
                {[1, 3, 5, 10].map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
              </Select>
            </label>
            <Button variant="dark" disabled={loading || !location.trim()}>
              <Search className="h-4 w-4" />
              {loading ? "Buscando..." : "Buscar leads"}
            </Button>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">Categorias <span className="font-medium text-stone-400">({categories.length || "todas"})</span></p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={selectAllCategories}>
                  <CheckSquare className="h-4 w-4" />
                  Todas
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={clearCategories}>
                  <Square className="h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {categoryConfigs.map((category) => (
                <label
                  key={category.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-parchment px-3 py-2.5 text-sm font-medium transition hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={categories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="h-4 w-4 rounded border-parchment text-charcoal focus:ring-charcoal"
                  />
                  {category.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Filtros</p>
            <div className="grid gap-2 md:grid-cols-4">
              {[
                ["noWebsiteOnly", "Apenas sem site"],
                ["withPhoneOnly", "Apenas com telefone"],
                ["ignoreFranchises", "Ignorar franquias"],
                ["prioritizeHighTicket", "Priorizar ticket alto"]
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-parchment px-3 py-2.5 text-sm font-medium transition hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <input
                    type="checkbox"
                    checked={filters[key as keyof typeof filters]}
                    onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.checked }))}
                    className="h-4 w-4 rounded border-parchment text-charcoal focus:ring-charcoal"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Use com moderação. O Nominatim geocodifica a localização; o Overpass busca empresas no OSM. Sem scraping do Google Maps.
          </div>
        </form>
      </Card>

      {error && <EmptyState title="Busca falhou" text={error} />}
      {loading && <Card className="p-6"><SkeletonRows /></Card>}
      {!loading && searched && !error && leads.length === 0 && <EmptyState title="Nenhum lead encontrado" text="Tente um raio maior, menos filtros ou categorias diferentes." />}
      {!loading && leads.length > 0 && (
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-xl font-bold tracking-tight text-charcoal dark:text-white">{leads.length} leads encontrados</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">{geoLabel}</p>
          </Card>
          <LeadList leads={leads} />
          <LeadMap leads={leads} />
        </div>
      )}
    </div>
  );
}
