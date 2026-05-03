export const leadStatuses = [
  "Novo",
  "Verificar",
  "Contatado",
  "Respondeu",
  "Reuniao",
  "Proposta enviada",
  "Fechado",
  "Descartado"
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export type ScoreLabel =
  | "Ótimo lead"
  | "Bom lead"
  | "Verificar manualmente"
  | "Baixo potencial";

export type Lead = {
  id: string;
  osmId?: string;
  name: string;
  category: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  lat: number;
  lng: number;
  score: number;
  scoreLabel: ScoreLabel;
  scoreReasons: string[];
  status: LeadStatus;
  notes: string;
  source: "openstreetmap";
  rawTags: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type LeadSearchFilters = {
  noWebsiteOnly: boolean;
  withPhoneOnly: boolean;
  ignoreFranchises: boolean;
  prioritizeHighTicket: boolean;
};

export type LeadSearchRequest = {
  location: string;
  radiusKm: number;
  categories: string[];
  filters: LeadSearchFilters;
};

export type SearchRun = {
  id: string;
  location: string;
  radiusKm: number;
  categories: string[];
  createdAt: string;
  resultCount: number;
};
