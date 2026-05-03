export type GeoResult = {
  label: string;
  lat: number;
  lng: number;
  city: string | null;
};

export type BoundingBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const geocodeCache = new Map<string, GeoResult>();

export async function geocodeLocation(location: string): Promise<GeoResult> {
  const key = location.trim().toLowerCase();
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({
    q: location,
    format: "jsonv2",
    limit: "1",
    addressdetails: "1"
  });
  const res = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      "User-Agent": "LocalLeadFinder/0.1 (personal MVP)"
    },
    next: { revalidate: 86400 },
    timeoutMs: 12000
  });
  if (!res.ok) throw new Error("Falha na geocodificação Nominatim");

  const data = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    address?: { city?: string; town?: string; village?: string; suburb?: string; state?: string };
  }>;
  const first = data[0];
  if (!first) throw new Error("Localização não encontrada");

  const result = {
    label: first.display_name,
    lat: Number(first.lat),
    lng: Number(first.lon),
    city: first.address?.city ?? first.address?.town ?? first.address?.village ?? first.address?.suburb ?? null
  };
  geocodeCache.set(key, result);
  return result;
}

export function toBoundingBox(lat: number, lng: number, radiusKm: number): BoundingBox {
  const latDelta = radiusKm / 111.32;
  const safeCos = Math.max(0.01, Math.abs(Math.cos((lat * Math.PI) / 180)));
  const lngDelta = radiusKm / (111.32 * safeCos);
  return {
    south: roundCoord(lat - latDelta),
    west: roundCoord(lng - lngDelta),
    north: roundCoord(lat + latDelta),
    east: roundCoord(lng + lngDelta)
  };
}

function roundCoord(value: number) {
  return Number(value.toFixed(6));
}
import { fetchWithTimeout } from "@/lib/fetch-timeout";
