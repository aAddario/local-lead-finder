import { isHighTicketCategory } from "@/lib/categories";
import type { Lead, ScoreLabel, ScoreReason } from "@/types/lead";

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
  "riachuelo",
  "localiza",
  "smart fit",
  "drogaria sao paulo"
];

type ScoreInput = Pick<Lead, "name" | "category" | "phone" | "website" | "address" | "rawTags"> &
  Partial<Pick<Lead, "websiteStatus" | "instagramUrl" | "facebookUrl">>;

export function looksLikeFranchise(name: string, tags: Record<string, string>) {
  const normalized = normalizeText(`${name} ${tags.brand ?? ""} ${tags.operator ?? ""}`);
  return Boolean(tags.brand || tags.operator || franchiseTerms.some((term) => normalized.includes(normalizeText(term))));
}

export function calculateLeadScore(input: ScoreInput) {
  const positiveReasons: ScoreReason[] = [];
  const negativeReasons: ScoreReason[] = [];
  const hasClearName = normalizeText(input.name).length >= 3 && !/^(loja|clinica|empresa|sem nome)$/i.test(input.name.trim());
  const hasAddress = Boolean(input.address && input.address.length >= 8);
  const hasCompleteAddress = Boolean(hasAddress && (input.rawTags["addr:street"] || input.rawTags["addr:housenumber"] || input.rawTags["addr:city"]));
  const hasPhone = Boolean(input.phone);
  const hasSocial = Boolean(input.instagramUrl || input.facebookUrl || input.rawTags["contact:instagram"] || input.rawTags["contact:facebook"]);
  const hasEmail = Boolean(input.rawTags.email || input.rawTags["contact:email"]);
  const hasAnyContact = hasPhone || hasSocial || hasEmail || Boolean(input.website);
  const franchise = looksLikeFranchise(input.name, input.rawTags);
  const highTicket = isHighTicketCategory(input.category);
  const websiteMissing = !input.website || input.websiteStatus === "no_website";
  const hasIncompleteData = !hasPhone && !input.website && !hasAddress && !hasSocial && !hasEmail;

  if (websiteMissing) {
    addPositive(positiveReasons, "Presença digital", "Não possui site cadastrado", 30);
  } else {
    addNegative(negativeReasons, "Presença digital", "Possui site cadastrado", -30);
  }

  if (hasPhone) addPositive(positiveReasons, "Facilidade de contato", "Telefone público disponível", 20);
  if (highTicket) addPositive(positiveReasons, "Potencial comercial", "Nicho de alto ticket", 15);
  if (hasCompleteAddress) addPositive(positiveReasons, "Qualidade dos dados", "Endereço completo ou claro", 10);
  if (!franchise) addPositive(positiveReasons, "Prioridade de abordagem", "Parece negócio local", 10);
  if (hasClearName) addPositive(positiveReasons, "Qualidade dos dados", "Nome comercial claro", 10);
  if (hasAnyContact) addPositive(positiveReasons, "Facilidade de contato", "Possui algum canal de contato", 10);

  if (franchise) addNegative(negativeReasons, "Prioridade de abordagem", "Parece franquia ou rede grande", -25);
  if (hasIncompleteData) addNegative(negativeReasons, "Qualidade dos dados", "Dados muito incompletos", -20);
  if (!highTicket) addNegative(negativeReasons, "Potencial comercial", "Categoria de menor potencial comercial", -15);

  if (input.websiteStatus === "bad_website") {
    addPositive(positiveReasons, "Presença digital", "Site marcado como ruim", 10);
  }

  const rawScore = [...positiveReasons, ...negativeReasons].reduce((total, reason) => total + reason.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));
  const scoreLabel = getScoreLabel(score);
  const scoreReasons = [
    ...positiveReasons.map((reason) => reason.label),
    ...negativeReasons.map((reason) => reason.label)
  ];

  return {
    score,
    scoreLabel,
    reasons: scoreReasons,
    positiveReasons,
    negativeReasons,
    explanation: buildScoreExplanation(scoreLabel, positiveReasons, negativeReasons)
  };
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

function addPositive(reasons: ScoreReason[], dimension: ScoreReason["dimension"], label: string, points: number) {
  reasons.push({ dimension, label, points });
}

function addNegative(reasons: ScoreReason[], dimension: ScoreReason["dimension"], label: string, points: number) {
  reasons.push({ dimension, label, points });
}

function buildScoreExplanation(scoreLabel: ScoreLabel, positive: ScoreReason[], negative: ScoreReason[]) {
  const mainPositive = positive.slice(0, 3).map((reason) => reason.label.toLowerCase());
  const mainNegative = negative.slice(0, 2).map((reason) => reason.label.toLowerCase());
  const positiveText = mainPositive.length ? mainPositive.join(", ") : "não há sinais positivos fortes";
  const negativeText = mainNegative.length ? ` Pontos de atenção: ${mainNegative.join(", ")}.` : "";
  return `Este lead foi classificado como "${scoreLabel}" porque ${positiveText}.${negativeText}`;
}
