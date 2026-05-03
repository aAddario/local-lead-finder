import { categoryById, categoryConfigs } from "@/lib/categories";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import type { BoundingBox } from "@/lib/geo";

export type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type OverpassResponse = {
  elements: OverpassElement[];
};

export async function fetchOverpassBusinesses(bbox: BoundingBox, categoryIds: string[]) {
  const query = buildOverpassQuery(bbox, categoryIds);
  const res = await fetchWithTimeout("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "LocalLeadFinder/0.1 (personal MVP)"
    },
    body: new URLSearchParams({ data: query }),
    next: { revalidate: 1800 },
    timeoutMs: 30000
  });
  if (!res.ok) throw new Error(`Falha no Overpass: ${res.status}`);
  return (await res.json()) as OverpassResponse;
}

export function buildOverpassQuery(bbox: BoundingBox, categoryIds: string[]) {
  const selected = categoryIds.length ? categoryIds.map((id) => categoryById.get(id)).filter(Boolean) : categoryConfigs;
  const bboxText = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const clauses: string[] = [];

  for (const category of selected) {
    if (!category) continue;
    for (const [tag, values] of Object.entries(category.tags)) {
      const regex = values.map(escapeRegex).join("|");
      clauses.push(`node["${tag}"~"^(${regex})$"](${bboxText});`);
      clauses.push(`way["${tag}"~"^(${regex})$"](${bboxText});`);
      clauses.push(`relation["${tag}"~"^(${regex})$"](${bboxText});`);
    }
  }

  return `[out:json][timeout:25];
(
  ${clauses.join("\n  ")}
);
out center tags;`;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
