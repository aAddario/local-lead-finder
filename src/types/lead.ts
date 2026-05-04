export const leadStatuses = [
  "Novo",
  "Verificar",
  "Verificado",
  "Contato enviado",
  "Respondeu",
  "Reunião marcada",
  "Proposta enviada",
  "Fechado",
  "Perdido",
  "Descartado"
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export const websiteStatuses = ["unknown", "no_website", "has_website", "bad_website", "good_website"] as const;
export type WebsiteStatus = (typeof websiteStatuses)[number];

export const validationStatuses = ["pending", "verified", "discarded"] as const;
export type ValidationStatus = (typeof validationStatuses)[number];

export const contactChannels = ["WhatsApp", "Instagram", "Ligação", "E-mail", "Presencial"] as const;
export type ContactChannel = (typeof contactChannels)[number];

export type ScoreLabel =
  | "Ótimo lead"
  | "Bom lead"
  | "Verificar manualmente"
  | "Baixo potencial";

export type ScoreDimension =
  | "Presença digital"
  | "Facilidade de contato"
  | "Potencial comercial"
  | "Qualidade dos dados"
  | "Prioridade de abordagem";

export type ScoreReason = {
  dimension: ScoreDimension;
  label: string;
  points: number;
};

export type WebsiteAnalysisLabel = "Site ruim" | "Site mediano" | "Site bom";

export type ContactHistoryEntry = {
  id: string;
  at: string;
  channel: ContactChannel;
  note: string;
};

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
  scorePositiveReasons: ScoreReason[];
  scoreNegativeReasons: ScoreReason[];
  scoreExplanation: string;
  status: LeadStatus;
  notes: string;
  source: "openstreetmap";
  rawTags: Record<string, string>;
  hasVerifiedWebsite: boolean;
  websiteStatus: WebsiteStatus;
  instagramUrl: string | null;
  facebookUrl: string | null;
  validationStatus: ValidationStatus;
  lastCheckedAt: string | null;
  firstContactAt: string | null;
  lastContactAt: string | null;
  nextActionAt: string | null;
  estimatedValue: number | null;
  offerType: string | null;
  contactChannel: ContactChannel | null;
  contactHistory: ContactHistoryEntry[];
  websiteAnalysisScore: number | null;
  websiteAnalysisLabel: WebsiteAnalysisLabel | null;
  websiteAnalysisNotes: string[];
  websiteAnalyzedAt: string | null;
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

export type Campaign = {
  id: string;
  name: string;
  city: string;
  niche: string;
  objective: string;
  primaryOffer: string;
  leadIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CampaignMetrics = {
  total: number;
  verified: number;
  contacted: number;
  responses: number;
  meetings: number;
  proposals: number;
  closed: number;
};
