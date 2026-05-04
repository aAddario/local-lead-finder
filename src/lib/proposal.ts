import { generateLeadDiagnosis } from "@/lib/diagnosis";
import type { Lead } from "@/types/lead";

export type LeadProposal = {
  companyName: string;
  identifiedProblem: string;
  suggestedSolution: string;
  includedItems: string[];
  suggestedDeadline: string;
  suggestedPriceRange: string;
  finalMessage: string;
  text: string;
};

export function generateLeadProposal(lead: Lead): LeadProposal {
  const diagnosis = generateLeadDiagnosis(lead);
  const priceRange = getPriceRange(lead);
  const items = getIncludedItems(lead);
  const deadline = lead.score >= 80 ? "5 a 7 dias úteis" : "7 a 12 dias úteis";
  const finalMessage = "A proposta é simples: criar presença digital clara, facilitar contato e transformar buscas locais em conversas comerciais.";

  const proposal = {
    companyName: lead.name,
    identifiedProblem: diagnosis.likelyProblem,
    suggestedSolution: diagnosis.solutionSuggested,
    includedItems: items,
    suggestedDeadline: deadline,
    suggestedPriceRange: priceRange,
    finalMessage,
    text: ""
  };

  return {
    ...proposal,
    text: [
      `Proposta para ${proposal.companyName}`,
      "",
      `Problema identificado: ${proposal.identifiedProblem}`,
      `Solução sugerida: ${proposal.suggestedSolution}`,
      "",
      "Itens inclusos:",
      ...proposal.includedItems.map((item) => `- ${item}`),
      "",
      `Prazo sugerido: ${proposal.suggestedDeadline}`,
      `Faixa de valor sugerida: ${proposal.suggestedPriceRange}`,
      "",
      proposal.finalMessage
    ].join("\n")
  };
}

function getIncludedItems(lead: Lead) {
  const base = [
    "Página profissional responsiva",
    "Seção de serviços",
    "Botão de WhatsApp",
    "Localização",
    "Seção de avaliações",
    "Formulário de contato"
  ];
  const normalized = lead.category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalized.includes("restaurante") || normalized.includes("cafe")) return [...base, "Cardápio ou destaques de produtos"];
  if (normalized.includes("estetica") || normalized.includes("salao")) return [...base, "Galeria ou imagens"];
  if (normalized.includes("clinica") || normalized.includes("dentista")) return [...base, "Lista de tratamentos e orientação de agendamento"];
  return [...base, "Galeria ou imagens"];
}

function getPriceRange(lead: Lead) {
  if (lead.offerType) return lead.offerType;
  if (!lead.website || lead.websiteStatus === "no_website") return "Landing page simples: R$ 500 a R$ 900";
  if (lead.websiteStatus === "bad_website" || lead.websiteAnalysisLabel === "Site ruim") return "Site institucional: R$ 900 a R$ 1.800";
  if (lead.score >= 80) return "Site + automação simples: R$ 1.500 a R$ 3.000";
  return "Landing page simples: R$ 500 a R$ 900";
}
