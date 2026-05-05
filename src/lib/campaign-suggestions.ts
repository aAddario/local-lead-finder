import type { Lead } from "@/types/lead";

export function suggestCampaignFromLeads(leads: Lead[], fallbackLocation = "Mercado local") {
  const city = mostCommon(leads.map((lead) => lead.city).filter(Boolean) as string[]) || fallbackLocation.split(",")[0] || "Mercado local";
  const niche = mostCommon(leads.map((lead) => lead.category)) || "Leads locais";
  const noWebsiteCount = leads.filter((lead) => !lead.website || lead.websiteStatus === "no_website").length;
  const highScoreCount = leads.filter((lead) => lead.score >= 80).length;
  const focus = noWebsiteCount >= highScoreCount ? "sem site" : "score alto";

  return {
    name: `${niche} em ${city}`,
    city,
    niche,
    objective: `Validar ${leads.length} leads de ${focus} e enviar proposta simples`,
    primaryOffer: "Landing page + WhatsApp"
  };
}

function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}
