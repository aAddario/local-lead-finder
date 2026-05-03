import { getReadableCategory } from "@/lib/categories";
import { calculateLeadScore, normalizeText } from "@/lib/score";
import type { GeoResult } from "@/lib/geo";
import type { OverpassElement } from "@/lib/overpass";
import type { Lead, LeadSearchFilters } from "@/types/lead";

export function normalizeOverpassElements(elements: OverpassElement[], geo: GeoResult, filters: LeadSearchFilters): Lead[] {
  const leads = elements
    .map((element) => normalizeElement(element, geo))
    .filter((lead): lead is Lead => Boolean(lead));
  const deduped = dedupeLeads(leads);
  return deduped
    .filter((lead) => !filters.noWebsiteOnly || !lead.website)
    .filter((lead) => !filters.withPhoneOnly || Boolean(lead.phone))
    .filter((lead) => !filters.ignoreFranchises || !lead.scoreReasons.includes("Possivel franquia/rede"))
    .sort((a, b) => b.score - a.score);
}

function normalizeElement(element: OverpassElement, geo: GeoResult): Lead | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!name || typeof lat !== "number" || typeof lng !== "number") return null;

  const category = getReadableCategory(tags);
  const phone = tags["contact:phone"] ?? tags.phone ?? null;
  const website = normalizeWebsite(tags["contact:website"] ?? tags.website ?? null);
  const address = buildAddress(tags);
  const now = new Date().toISOString();
  const base = {
    id: `osm-${element.type}-${element.id}`,
    osmId: `${element.type}/${element.id}`,
    name,
    category,
    phone,
    website,
    address,
    city: tags["addr:city"] ?? geo.city,
    lat,
    lng,
    score: 0,
    scoreLabel: "Baixo potencial" as const,
    scoreReasons: [],
    status: "Novo" as const,
    notes: "",
    source: "openstreetmap" as const,
    rawTags: tags,
    createdAt: now,
    updatedAt: now
  };
  const score = calculateLeadScore(base);
  return { ...base, score: score.score, scoreLabel: score.scoreLabel, scoreReasons: score.reasons };
}

function normalizeWebsite(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function buildAddress(tags: Record<string, string>) {
  const streetLine = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", ");
  const rest = [tags["addr:neighbourhood"], tags["addr:city"], tags["addr:postcode"]].filter(Boolean).join(" - ");
  const address = [streetLine, rest].filter(Boolean).join(" | ");
  return address || null;
}

function dedupeLeads(leads: Lead[]) {
  const seen = new Set<string>();
  const output: Lead[] = [];
  for (const lead of leads) {
    const key = `${normalizeText(lead.name)}:${lead.lat.toFixed(4)}:${lead.lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(lead);
  }
  return output;
}
