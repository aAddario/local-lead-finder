import { getReadableCategory } from "@/lib/categories";
import { calculateDataConfidence, normalizeEmail, normalizePhone, normalizeSocialUrl, normalizeWebsite } from "@/lib/data-quality";
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
    .filter((lead) => !filters.ignoreFranchises || !lead.scoreNegativeReasons.some((reason) => reason.label.includes("franquia")))
    .sort((a, b) => b.score - a.score);
}

function normalizeElement(element: OverpassElement, geo: GeoResult): Lead | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!name || typeof lat !== "number" || typeof lng !== "number") return null;

  const category = getReadableCategory(tags);
  const phone = normalizePhone(firstTag(tags, ["contact:phone", "phone", "mobile", "contact:mobile"]));
  const email = normalizeEmail(firstTag(tags, ["contact:email", "email"]));
  const website = normalizeWebsite(firstTag(tags, ["contact:website", "website", "url", "contact:url"]));
  const instagramUrl = normalizeSocialUrl(firstTag(tags, ["contact:instagram", "instagram", "social:instagram"]), "https://www.instagram.com/");
  const facebookUrl = normalizeSocialUrl(firstTag(tags, ["contact:facebook", "facebook", "social:facebook"]), "https://www.facebook.com/");
  const address = buildAddress(tags);
  const now = new Date().toISOString();
  const base = {
    id: `osm-${element.type}-${element.id}`,
    osmId: `${element.type}/${element.id}`,
    name,
    category,
    phone,
    email,
    website,
    address,
    city: tags["addr:city"] ?? geo.city,
    lat,
    lng,
    score: 0,
    scoreLabel: "Baixo potencial" as const,
    scoreReasons: [],
    scorePositiveReasons: [],
    scoreNegativeReasons: [],
    scoreExplanation: "",
    status: "Novo" as const,
    notes: "",
    source: "openstreetmap" as const,
    rawTags: tags,
    hasVerifiedWebsite: false,
    websiteStatus: website ? ("has_website" as const) : ("unknown" as const),
    instagramUrl,
    facebookUrl,
    dataConfidenceScore: 0,
    dataConfidenceLabel: "Baixa" as const,
    validationStatus: "pending" as const,
    lastCheckedAt: null,
    firstContactAt: null,
    lastContactAt: null,
    nextActionAt: null,
    estimatedValue: null,
    offerType: null,
    contactChannel: null,
    contactHistory: [],
    websiteAnalysisScore: null,
    websiteAnalysisLabel: null,
    websiteAnalysisNotes: [],
    websiteAnalyzedAt: null,
    createdAt: now,
    updatedAt: now
  };
  const score = calculateLeadScore(base);
  const confidence = calculateDataConfidence(base);
  return {
    ...base,
    dataConfidenceScore: confidence.score,
    dataConfidenceLabel: confidence.label,
    score: score.score,
    scoreLabel: score.scoreLabel,
    scoreReasons: score.reasons,
    scorePositiveReasons: score.positiveReasons,
    scoreNegativeReasons: score.negativeReasons,
    scoreExplanation: score.explanation
  };
}

function firstTag(tags: Record<string, string>, keys: string[]) {
  return keys.map((key) => tags[key]).find((value) => Boolean(value?.trim())) ?? null;
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
