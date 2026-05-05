import { generateLeadDiagnosis } from "@/lib/diagnosis";
import { getWhatsAppPhone } from "@/lib/data-quality";
import type { Lead } from "@/types/lead";

export type MessageTone = "short" | "professional" | "informal" | "personalized";

type NicheTemplate = {
  match: string[];
  short: string;
  professional: string;
  informal: string;
};

const templates: Record<string, NicheTemplate> = {
  medical: {
    match: ["clinica medica", "clinica", "medico", "doctor"],
    short: "Olá, tudo bem? Vi a [EMPRESA] nas buscas locais e não encontrei um site oficial com informações claras sobre serviços, horários e agendamento. Posso te mostrar uma ideia simples para melhorar isso?",
    professional: "Olá, tudo bem? Vi que a [EMPRESA] aparece nas buscas locais, mas não encontrei um site oficial com informações claras sobre serviços, horários e formas de agendamento. Eu trabalho criando páginas simples e automações para negócios locais melhorarem atendimento e captação. Posso te mostrar uma ideia rápida de como isso ficaria para sua clínica?",
    informal: "Oi! Vi a [EMPRESA] nas buscas locais e senti falta de uma página simples com serviços, horários e WhatsApp. Faço esse tipo de página para clínicas locais. Posso te mandar uma ideia rápida?"
  },
  dental: {
    match: ["dentista", "odontologica", "odontologia"],
    short: "Olá! Vi a [EMPRESA] e não encontrei um site claro com tratamentos, horários e WhatsApp. Posso te mostrar uma página simples para captar mais pacientes?",
    professional: "Olá, tudo bem? Encontrei a [EMPRESA] nas buscas locais e percebi oportunidade de melhorar a presença digital com uma página clara de tratamentos, localização, horários e agendamento via WhatsApp. Posso te enviar uma proposta simples?",
    informal: "Oi! Vi a [EMPRESA] e acho que uma página com tratamentos, localização e botão de WhatsApp ajudaria bastante. Quer que eu te mostre um exemplo?"
  },
  aesthetics: {
    match: ["estetica", "beleza", "beauty"],
    short: "Olá! Vi a [EMPRESA] e percebi espaço para uma página com procedimentos, fotos, localização e WhatsApp. Posso te mostrar uma ideia?",
    professional: "Olá, tudo bem? Vi a [EMPRESA] nas buscas locais e acredito que uma landing page com procedimentos, antes/depois, localização e botão de WhatsApp pode aumentar pedidos de orçamento. Posso te enviar um modelo de proposta?",
    informal: "Oi! Vi a [EMPRESA] e pensei numa página bonita com serviços, fotos e WhatsApp direto. Quer ver uma ideia?"
  },
  salon: {
    match: ["salao", "hairdresser", "cabelo"],
    short: "Olá! Vi a [EMPRESA] e senti falta de uma página com serviços, fotos, horários e WhatsApp. Posso te mostrar uma ideia simples?",
    professional: "Olá, tudo bem? Encontrei a [EMPRESA] nas buscas locais e vi oportunidade de organizar serviços, galeria, localização e agendamentos em uma página profissional. Posso te enviar uma ideia rápida?",
    informal: "Oi! Achei a [EMPRESA] e pensei que uma página com fotos, serviços e WhatsApp direto ajudaria nos agendamentos. Posso te mostrar?"
  },
  restaurant: {
    match: ["restaurante", "cafe", "lanchonete"],
    short: "Olá! Vi a [EMPRESA] e não encontrei uma página clara com cardápio, horários e WhatsApp. Posso te mostrar uma ideia?",
    professional: "Olá, tudo bem? Vi a [EMPRESA] nas buscas locais e percebi oportunidade de melhorar cardápio, horários, localização e pedidos pelo WhatsApp em uma página simples. Posso te enviar uma proposta?",
    informal: "Oi! Vi a [EMPRESA] e senti falta de uma página rápida com cardápio, endereço e botão de pedido. Quer ver uma ideia?"
  },
  repair: {
    match: ["oficina", "mecanica", "mechanic"],
    short: "Olá! Vi a [EMPRESA] e não encontrei um site claro com serviços, localização e WhatsApp. Posso te mostrar uma ideia simples?",
    professional: "Olá, tudo bem? Encontrei a [EMPRESA] nas buscas locais e percebi oportunidade de criar uma página com serviços, localização, avaliações e botão de WhatsApp para orçamento. Posso te enviar um exemplo?",
    informal: "Oi! Vi a [EMPRESA] e pensei numa página simples para serviços, localização e orçamentos pelo WhatsApp. Posso mostrar?"
  },
  pet: {
    match: ["pet", "veterinaria"],
    short: "Olá! Vi a [EMPRESA] e senti falta de uma página com serviços, horários, localização e WhatsApp. Posso te mostrar uma ideia?",
    professional: "Olá, tudo bem? Vi a [EMPRESA] nas buscas locais e acredito que uma página com serviços, banho e tosa, veterinário, localização e WhatsApp pode facilitar novos atendimentos. Posso te enviar uma proposta simples?",
    informal: "Oi! Vi a [EMPRESA] e pensei numa página com serviços, horários e WhatsApp direto. Quer ver uma ideia?"
  },
  gym: {
    match: ["academia", "fitness", "gym"],
    short: "Olá! Vi a [EMPRESA] e não encontrei uma página clara com planos, horários e WhatsApp. Posso te mostrar uma ideia?",
    professional: "Olá, tudo bem? Encontrei a [EMPRESA] nas buscas locais e percebi oportunidade de apresentar planos, horários, estrutura e matrícula via WhatsApp em uma landing page. Posso te mandar um exemplo?",
    informal: "Oi! Vi a [EMPRESA] e uma página com planos, horários e WhatsApp de matrícula ajudaria bastante. Quer ver?"
  },
  store: {
    match: ["loja", "moveis", "furniture", "comercio"],
    short: "Olá! Vi a [EMPRESA] e percebi espaço para uma página com produtos, localização e WhatsApp. Posso te mostrar uma ideia?",
    professional: "Olá, tudo bem? Vi a [EMPRESA] nas buscas locais e acredito que uma página simples com produtos, localização, galeria e botão de WhatsApp pode gerar mais pedidos. Posso te enviar uma sugestão?",
    informal: "Oi! Vi a [EMPRESA] e pensei numa página simples com produtos, fotos e WhatsApp. Quer ver uma ideia?"
  },
  law: {
    match: ["advocacia", "juridico", "lawyer"],
    short: "Olá! Vi a [EMPRESA] e não encontrei uma página clara com áreas de atuação e contato. Posso te mostrar uma ideia profissional?",
    professional: "Olá, tudo bem? Encontrei a [EMPRESA] nas buscas locais e vi oportunidade de criar uma página institucional com áreas de atuação, localização, contato e formulário. Posso te enviar uma proposta objetiva?",
    informal: "Oi! Vi a [EMPRESA] e uma página profissional com áreas de atuação e contato direto poderia ajudar. Posso mostrar uma ideia?"
  },
  generic: {
    match: [],
    short: "Olá! Vi a [EMPRESA] nas buscas locais e percebi uma oportunidade de melhorar a presença digital. Posso te mostrar uma ideia simples?",
    professional: "Olá, tudo bem? Vi a [EMPRESA] nas buscas locais e percebi oportunidade de organizar serviços, localização e contato em uma página profissional simples. Posso te enviar uma ideia rápida?",
    informal: "Oi! Vi a [EMPRESA] e pensei numa página simples com serviços, endereço e WhatsApp. Quer ver uma ideia?"
  }
};

export function getOutreachMessage(lead: Pick<Lead, "name" | "category" | "website" | "scoreLabel">, tone: MessageTone = "professional") {
  const template = getNicheTemplate(lead.category);
  const message = tone === "personalized" ? buildPersonalizedMessage(lead) : template[tone];
  return message.replaceAll("[EMPRESA]", lead.name);
}

export function getNicheKey(category: string) {
  const normalized = normalize(category);
  return Object.entries(templates).find(([, template]) => template.match.some((term) => normalized.includes(term)))?.[0] ?? "generic";
}

export function getGoogleSearchUrl(lead: Pick<Lead, "name" | "city">) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${lead.city ?? ""}`)}`;
}

export function getInstagramSearchUrl(lead: Pick<Lead, "name" | "city">) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${lead.city ?? ""} Instagram`)}`;
}

export function getFacebookSearchUrl(lead: Pick<Lead, "name" | "city">) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${lead.city ?? ""} Facebook`)}`;
}

export function getWhatsAppUrl(lead: Pick<Lead, "phone" | "name" | "category" | "website" | "scoreLabel">) {
  const phone = getWhatsAppPhone(lead.phone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(getOutreachMessage(lead, "short"))}`;
}

export function getMapUrl(lead: Pick<Lead, "lat" | "lng">) {
  return `https://www.openstreetmap.org/?mlat=${lead.lat}&mlon=${lead.lng}#map=18/${lead.lat}/${lead.lng}`;
}

function getNicheTemplate(category: string) {
  return templates[getNicheKey(category)] ?? templates.generic;
}

function buildPersonalizedMessage(lead: Pick<Lead, "name" | "category" | "website" | "scoreLabel">) {
  const diagnosis = generateLeadDiagnosis(lead as Lead);
  return `Olá, tudo bem? Analisei a presença local da [EMPRESA] e identifiquei uma oportunidade: ${diagnosis.opportunity} Minha sugestão inicial é ${diagnosis.solutionSuggested.toLowerCase()} Posso te mostrar uma proposta simples e objetiva para isso?`;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
