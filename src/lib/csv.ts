import type { Lead } from "@/types/lead";

const columns = ["name", "category", "phone", "website", "address", "city", "lat", "lng", "score", "scoreLabel", "status", "notes", "source", "createdAt"] as const;

export function leadsToCsv(leads: Lead[]) {
  const rows = leads.map((lead) => columns.map((column) => escapeCsv(String(lead[column] ?? ""))).join(","));
  return [columns.join(","), ...rows].join("\n");
}

function escapeCsv(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}
