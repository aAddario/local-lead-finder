import { NextResponse } from "next/server";
import { z } from "zod";
import { geocodeLocation, toBoundingBox } from "@/lib/geo";
import { normalizeOverpassElements } from "@/lib/lead-normalizer";
import { fetchOverpassBusinesses } from "@/lib/overpass";
import { listLeadsByIds, recordSearch } from "@/lib/db";
import { categoryById } from "@/lib/categories";

const schema = z.object({
  location: z.string().min(2),
  radiusKm: z.number().min(0.5).max(10),
  categories: z.array(z.string()).default([]),
  filters: z.object({
    noWebsiteOnly: z.boolean().default(false),
    withPhoneOnly: z.boolean().default(false),
    ignoreFranchises: z.boolean().default(false),
    prioritizeHighTicket: z.boolean().default(false)
  })
});

export async function POST(req: Request) {
  try {
    const input = schema.parse(await req.json());
    const categories = input.categories.filter((id) => categoryById.has(id));
    if (input.categories.length > 0 && categories.length === 0) {
      return NextResponse.json({ error: "Nenhuma categoria válida selecionada" }, { status: 400 });
    }
    const geo = await geocodeLocation(input.location);
    const bbox = toBoundingBox(geo.lat, geo.lng, input.radiusKm);
    const overpass = await fetchOverpassBusinesses(bbox, categories);
    const leads = normalizeOverpassElements(overpass.elements, geo, input.filters);
    const sorted = input.filters.prioritizeHighTicket ? leads.sort((a, b) => b.score - a.score) : leads;
    const savedLeads = listLeadsByIds(sorted.map((lead) => lead.id));
    const savedLeadById = new Map(savedLeads.map((lead) => [lead.id, lead]));
    const merged = sorted.map((lead) => savedLeadById.get(lead.id) ?? lead);
    const search = recordSearch({ location: input.location, radiusKm: input.radiusKm, categories, filters: input.filters, geo, resultCount: sorted.length, leads: sorted });
    return NextResponse.json({ geo, bbox, leads: merged, savedLeadIds: savedLeads.map((lead) => lead.id), searchId: search.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Busca falhou";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
