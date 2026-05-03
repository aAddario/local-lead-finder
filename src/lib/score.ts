import { isHighTicketCategory } from "@/lib/categories";
import type { Lead, ScoreLabel } from "@/types/lead";

const franchiseTerms = [
  "mcdonald",
  "burger king",
  "subway",
  "cacau show",
  "boticario",
  "drogasil",
  "pague menos",
  "americanas",
  "magazine luiza",
  "casas bahia",
  "renner",
  "riachuelo"
];

export function looksLikeFranchise(name: string, tags: Record<string, string>) {
  const normalized = normalizeText(`${name} ${tags.brand ?? ""} ${tags.operator ?? ""}`);
  return Boolean(tags.brand || tags.operator || franchiseTerms.some((term) => normalized.includes(normalizeText(term))));
}

export function calculateLeadScore(input: Pick<Lead, "name" | "category" | "phone" | "website" | "address" | "rawTags">) {
  let score = 0;
  const reasons: string[] = [];
  const hasClearName = input.name.trim().length >= 3;
  const hasAddress = Boolean(input.address && input.address.length >= 8);
  const hasIncompleteData = !input.phone && !input.website && !hasAddress;
  const franchise = looksLikeFranchise(input.name, input.rawTags);
  const highTicket = isHighTicketCategory(input.category);

  if (!input.website) {
    score += 35;
    reasons.push("Site não encontrado na fonte");
  } else {
    score -= 30;
    reasons.push("Site cadastrado");
  }

  if (input.phone) {
    score += 20;
    reasons.push("Telefone público");
  }

  if (highTicket) {
    score += 15;
    reasons.push("Nicho de ticket alto");
  }

  if (hasAddress) {
    score += 10;
    reasons.push("Endereço claro");
  }

  if (!franchise) {
    score += 10;
    reasons.push("Parece negócio local");
  } else {
    score -= 25;
    reasons.push("Possível franquia/rede");
  }

  if (hasClearName) {
    score += 10;
    reasons.push("Nome comercial claro");
  }

  if (hasIncompleteData) {
    score -= 20;
    reasons.push("Dados muito incompletos");
  }

  if (!highTicket) {
    score -= 15;
    reasons.push("Categoria com potencial menor");
  }

  const bounded = Math.max(0, Math.min(100, score));
  return { score: bounded, scoreLabel: getScoreLabel(bounded), reasons };
}

export function getScoreLabel(score: number): ScoreLabel {
  if (score >= 80) return "Ótimo lead";
  if (score >= 60) return "Bom lead";
  if (score >= 40) return "Verificar manualmente";
  return "Baixo potencial";
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
