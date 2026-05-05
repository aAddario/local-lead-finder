import { normalizeText } from "@/lib/score";
import type { DataConfidenceLabel, Lead } from "@/types/lead";

export type DuplicateGroup = {
  id: string;
  reason: string;
  leads: Lead[];
};

export function normalizePhone(value: string | null) {
  if (!value) return null;
  const first = value.split(/[;/,|]/)[0]?.trim() ?? "";
  const digits = first.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("55") && digits.length >= 12) return `+${digits}`;
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("0")) return `+55${digits}`;
  if (digits.length > 11 && !digits.startsWith("55")) return `+${digits}`;
  return `+${digits}`;
}

export function getWhatsAppPhone(value: string | null) {
  const phone = normalizePhone(value);
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits;
}

export function normalizeEmail(value: string | null) {
  if (!value) return null;
  const email = value.split(/[;, ]/).find((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.trim()));
  return email?.trim().toLowerCase() ?? null;
}

export function normalizeWebsite(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function normalizeSocialUrl(value: string | null, baseUrl: string) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^@/, "");
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `${baseUrl}${trimmed}`;
}

export function calculateDataConfidence(lead: Partial<Lead>) {
  let score = 0;
  if (lead.name && lead.name.length > 2) score += 15;
  if (lead.category) score += 10;
  if (lead.phone) score += 18;
  if (lead.email) score += 12;
  if (lead.website) score += 12;
  if (lead.instagramUrl || lead.facebookUrl) score += 10;
  if (lead.address) score += 10;
  if (lead.city) score += 5;
  if (typeof lead.lat === "number" && typeof lead.lng === "number") score += 8;
  const bounded = Math.min(100, score);
  return {
    score: bounded,
    label: confidenceLabel(bounded)
  };
}

export function findDuplicateGroups(leads: Lead[]) {
  const groups: DuplicateGroup[] = [];
  const used = new Set<string>();

  addGroups(groups, used, leads, "phone", (lead) => getWhatsAppPhone(lead.phone), "Mesmo telefone");
  addGroups(groups, used, leads, "email", (lead) => lead.email, "Mesmo e-mail");
  addGroups(groups, used, leads, "website", (lead) => normalizeDomain(lead.website), "Mesmo site");
  addGroups(groups, used, leads, "nearby", (lead) => nearbyKey(lead), "Nome e localização muito próximos");

  return groups;
}

function addGroups(groups: DuplicateGroup[], used: Set<string>, leads: Lead[], prefix: string, selector: (lead: Lead) => string | null, reason: string) {
  const map = new Map<string, Lead[]>();
  for (const lead of leads) {
    const key = selector(lead);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(lead);
    map.set(key, list);
  }
  for (const [key, items] of map.entries()) {
    const unique = items.filter((lead) => !used.has(`${prefix}:${lead.id}`));
    if (unique.length < 2) continue;
    unique.forEach((lead) => used.add(`${prefix}:${lead.id}`));
    groups.push({ id: `${prefix}:${key}`, reason, leads: unique });
  }
}

function nearbyKey(lead: Lead) {
  if (!lead.name || !lead.lat || !lead.lng) return null;
  return `${normalizeText(lead.name)}:${lead.lat.toFixed(3)}:${lead.lng.toFixed(3)}`;
}

function normalizeDomain(value: string | null) {
  if (!value) return null;
  try {
    return new URL(normalizeWebsite(value) ?? value).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function confidenceLabel(score: number): DataConfidenceLabel {
  if (score >= 75) return "Alta";
  if (score >= 45) return "Média";
  return "Baixa";
}
