import type { Lead } from "@/types/lead";

export type LeadDiagnosis = {
  likelyProblem: string;
  opportunity: string;
  solutionSuggested: string;
  recommendedOffer: string;
  priorityLevel: "Alta" | "Média" | "Baixa";
  summary: string;
};

export function generateLeadDiagnosis(lead: Pick<Lead, "website" | "websiteStatus" | "category" | "phone" | "score" | "scoreLabel" | "websiteAnalysisLabel">): LeadDiagnosis {
  const noWebsite = !lead.website || lead.websiteStatus === "no_website";
  const weakWebsite = lead.websiteStatus === "bad_website" || lead.websiteAnalysisLabel === "Site ruim" || lead.websiteAnalysisLabel === "Site mediano";
  const highPriority = lead.score >= 80 || noWebsite || weakWebsite;
  const hasPhone = Boolean(lead.phone);
  const offer = getRecommendedOffer(lead.category, noWebsite, weakWebsite);

  const likelyProblem = noWebsite
    ? "A empresa não possui site cadastrado e pode depender apenas de redes sociais ou atendimento manual."
    : weakWebsite
      ? "A empresa possui site, mas ele pode estar incompleto, antigo ou pouco focado em conversão."
      : "A presença digital existe, mas ainda pode faltar uma jornada clara para transformar visitantes em contatos.";

  const opportunity = noWebsite
    ? "Clientes podem ter dificuldade para encontrar informações claras sobre serviços, horários e formas de contato."
    : "Clientes podem abandonar a busca se o site não tiver CTA, WhatsApp, serviços claros ou formulário de contato.";

  const solutionSuggested = noWebsite
    ? "Criar uma landing page com serviços, localização, botão de WhatsApp, avaliações e formulário de contato."
    : "Melhorar a página principal com CTA claro, WhatsApp, serviços, prova social e formulário de contato.";

  return {
    likelyProblem,
    opportunity,
    solutionSuggested,
    recommendedOffer: offer,
    priorityLevel: highPriority ? "Alta" : hasPhone ? "Média" : "Baixa",
    summary: `${lead.scoreLabel}: ${offer}.`
  };
}

function getRecommendedOffer(category: string, noWebsite: boolean, weakWebsite: boolean) {
  const normalized = category.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (weakWebsite) return "Redesign rápido + CTA de WhatsApp + ajustes de conversão.";
  if (normalized.includes("clinica") || normalized.includes("dentista") || normalized.includes("estetica")) {
    return noWebsite ? "Landing page + botão de WhatsApp + organização inicial da presença digital." : "Página de serviços + agendamento pelo WhatsApp.";
  }
  if (normalized.includes("restaurante") || normalized.includes("cafe")) return "Página com cardápio, localização e pedidos pelo WhatsApp.";
  if (normalized.includes("oficina")) return "Página de serviços + formulário de orçamento + WhatsApp.";
  if (normalized.includes("pet") || normalized.includes("veterinaria")) return "Página de serviços + agenda inicial + WhatsApp.";
  return noWebsite ? "Landing page simples + WhatsApp + formulário de contato." : "Otimização da página principal + CTA claro.";
}
