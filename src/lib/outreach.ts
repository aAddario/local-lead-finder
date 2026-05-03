import type { Lead } from "@/types/lead";

export function getOutreachMessage(lead: Pick<Lead, "name">) {
  return `Olá! Tudo bem?

Vi a ${lead.name} nas buscas locais e percebi que talvez vocês ainda não tenham um site oficial com informações claras dos serviços.

Eu trabalho criando sites simples, bonitos e automações para WhatsApp para negócios locais.

Posso te mandar uma ideia rápida de como isso poderia ficar para vocês?`;
}

export function getGoogleSearchUrl(lead: Pick<Lead, "name" | "city">) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${lead.city ?? ""}`)}`;
}

export function getInstagramSearchUrl(lead: Pick<Lead, "name" | "city">) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${lead.name} ${lead.city ?? ""} Instagram`)}`;
}

export function getMapUrl(lead: Pick<Lead, "lat" | "lng">) {
  return `https://www.openstreetmap.org/?mlat=${lead.lat}&mlon=${lead.lng}#map=18/${lead.lat}/${lead.lng}`;
}
