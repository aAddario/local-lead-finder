"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CheckSquare, Globe2, History, MapPin, Search, SlidersHorizontal, Square, Target } from "lucide-react";
import { LeadList } from "@/components/lead-list";
import { LeadMap } from "@/components/lead-map";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRows } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { categoryConfigs } from "@/lib/categories";
import { fetchJson } from "@/lib/api";
import { defaultCountryId, defaultPlaceId, getCountryPreset, getPlacePreset, locationPresetCountries } from "@/lib/location-presets";
import type { Lead, LeadSearchRequest } from "@/types/lead";

type SearchResponse = { leads: Lead[]; geo: { label: string; lat: number; lng: number }; savedLeadIds: string[]; searchId: string };

export default function SearchPage() {
  const [countryId, setCountryId] = useState(defaultCountryId);
  const [placeId, setPlaceId] = useState(defaultPlaceId);
  const [radiusKm, setRadiusKm] = useState(3);
  const [categories, setCategories] = useState<string[]>(["clinics", "dentists", "salons", "petshops", "offices"]);
  const [filters, setFilters] = useState({ noWebsiteOnly: true, withPhoneOnly: false, ignoreFranchises: true, prioritizeHighTicket: true });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [savedLeadIds, setSavedLeadIds] = useState<string[]>([]);
  const [searchId, setSearchId] = useState("");
  const [geoLabel, setGeoLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const selectedCountry = getCountryPreset(countryId);
  const selectedPlace = getPlacePreset(countryId, placeId);
  const location = selectedPlace.query;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const payload: LeadSearchRequest = { location, radiusKm, categories, filters };
      const data = await fetchJson<SearchResponse>("/api/search", { method: "POST", body: JSON.stringify(payload) });
      setLeads(data.leads);
      setSavedLeadIds(data.savedLeadIds ?? []);
      setSearchId(data.searchId ?? "");
      setGeoLabel(data.geo.label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na busca");
      setLeads([]);
      setSavedLeadIds([]);
      setSearchId("");
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

  function changeCountry(nextCountryId: string) {
    const nextCountry = getCountryPreset(nextCountryId);
    setCountryId(nextCountry.id);
    setPlaceId(nextCountry.places[0].id);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <section className="relative overflow-hidden rounded-2xl border border-parchment bg-[linear-gradient(135deg,#fbfaf6_0%,#f3f7f2_48%,#eef4f6_100%)] p-6 dark:border-white/10 dark:bg-[linear-gradient(135deg,#10121b_0%,#171a28_55%,#20261f_100%)] md:p-8">
        <div className="max-w-4xl">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <Target className="h-4 w-4" />
            Busca por area
          </p>
          <h1 className="mt-3 max-w-4xl text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-4xl">
            Escolha pais e cidade. Sem digitar localizacao.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300 md:text-base">
            Presets reduzem erro de geocodificacao e deixam cada busca repetivel por mercado.
          </p>
        </div>

        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl border border-white/70 bg-white/70 p-4 shadow-tight dark:border-white/10 dark:bg-white/5">
            <p className="font-bold text-charcoal dark:text-white">{selectedCountry.label}</p>
            <p className="mt-1 text-stone-500 dark:text-stone-400">{selectedPlace.label}</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/70 p-4 shadow-tight dark:border-white/10 dark:bg-white/5">
            <p className="font-bold text-charcoal dark:text-white">{radiusKm} km radius</p>
            <p className="mt-1 text-stone-500 dark:text-stone-400">Focused local sweep</p>
          </div>
          <div className="rounded-xl border border-white/70 bg-white/70 p-4 shadow-tight dark:border-white/10 dark:bg-white/5">
            <p className="font-bold text-charcoal dark:text-white">{categories.length || "Todas"} categorias</p>
            <p className="mt-1 text-stone-500 dark:text-stone-400">{activeFilterCount} filtros ativos</p>
          </div>
        </div>
      </section>

      <Card className="p-6 shadow-soft">
        <form onSubmit={submit} className="grid gap-6">
          <div className="grid gap-4 lg:grid-cols-[220px_1fr_150px_auto] lg:items-end">
            <label className="grid gap-2 text-sm font-semibold">
              <span className="inline-flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-stone-400" />
                Pais
              </span>
              <Select value={countryId} onChange={(event) => changeCountry(event.target.value)}>
                {locationPresetCountries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-stone-400" />
                Cidade / mercado
              </span>
              <Select value={selectedPlace.id} onChange={(event) => setPlaceId(event.target.value)}>
                {selectedCountry.places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.label} - {place.hint}
                  </option>
                ))}
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Raio
              <Select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}>
                {[1, 3, 5, 10].map((radius) => (
                  <option key={radius} value={radius}>
                    {radius} km
                  </option>
                ))}
              </Select>
            </label>
            <Button variant="dark" disabled={loading}>
              <Search className="h-4 w-4" />
              {loading ? "Buscando..." : "Buscar leads"}
            </Button>
          </div>

          <div className="rounded-xl border border-parchment bg-stone-50/70 px-4 py-3 text-sm text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
            <span className="font-bold text-charcoal dark:text-white">Consulta:</span> {location}
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                Categorias <span className="font-medium text-stone-400">({categories.length || "todas"})</span>
              </p>
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
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-parchment px-3 py-2.5 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5"
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
            <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-stone-400" />
              Filtros
            </p>
            <div className="grid gap-2 md:grid-cols-4">
              {[
                ["noWebsiteOnly", "Apenas sem site"],
                ["withPhoneOnly", "Apenas com telefone"],
                ["ignoreFranchises", "Ignorar franquias"],
                ["prioritizeHighTicket", "Priorizar ticket alto"]
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-parchment px-3 py-2.5 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-stone-50 dark:border-white/10 dark:hover:bg-white/5"
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
            Use com moderacao. O Nominatim geocodifica a localizacao; o Overpass busca empresas no OSM. Sem scraping do Google Maps.
          </div>
        </form>
      </Card>

      {error && <EmptyState title="Busca falhou" text={error} />}
      {loading && <Card className="p-6"><SkeletonRows /></Card>}
      {!loading && searched && !error && leads.length === 0 && <EmptyState title="Nenhum lead encontrado" text="Tente um raio maior, menos filtros ou categorias diferentes." />}
      {!loading && leads.length > 0 && (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-charcoal dark:text-white">{leads.length} leads encontrados</h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">{geoLabel}</p>
              </div>
              {searchId && (
                <Link href={`/searches/${searchId}`} className="no-underline">
                  <Button size="sm" variant="cream">
                    <History className="h-4 w-4" />
                    Abrir registro
                  </Button>
                </Link>
              )}
            </div>
          </Card>
          <LeadList
            leads={leads}
            persistedLeadIds={savedLeadIds}
            allowCreateCampaignFromVisible
            onChange={setLeads}
            onLeadSaved={(lead) => setSavedLeadIds((current) => (current.includes(lead.id) ? current : [...current, lead.id]))}
          />
          <LeadMap leads={leads} />
        </div>
      )}
    </div>
  );
}
