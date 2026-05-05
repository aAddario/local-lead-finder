import Database from "better-sqlite3";
import path from "node:path";
import { calculateDataConfidence, normalizeEmail, normalizePhone, normalizeSocialUrl, normalizeWebsite } from "@/lib/data-quality";
import { calculateLeadScore } from "@/lib/score";
import type { Campaign, CampaignMetrics, Lead, LeadSearchFilters, LeadStatus, SearchGeo, SearchRun, SearchRunDetail } from "@/types/lead";

const dbPath = path.join(process.cwd(), "local-lead-finder.sqlite");
let db: Database.Database | null = null;

type LeadPatch = Partial<
  Pick<
    Lead,
    | "status"
    | "notes"
    | "phone"
    | "email"
    | "website"
    | "hasVerifiedWebsite"
    | "websiteStatus"
    | "instagramUrl"
    | "facebookUrl"
    | "validationStatus"
    | "lastCheckedAt"
    | "firstContactAt"
    | "lastContactAt"
    | "nextActionAt"
    | "estimatedValue"
    | "offerType"
    | "contactChannel"
    | "contactHistory"
    | "websiteAnalysisScore"
    | "websiteAnalysisLabel"
    | "websiteAnalysisNotes"
    | "websiteAnalyzedAt"
  >
>;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    migrate(db);
  }
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    create table if not exists leads (
      id text primary key,
      osmId text,
      name text not null,
      category text not null,
      phone text,
      email text,
      website text,
      address text,
      city text,
      lat real not null,
      lng real not null,
      score integer not null,
      scoreLabel text not null,
      scoreReasons text not null,
      scorePositiveReasons text not null default '[]',
      scoreNegativeReasons text not null default '[]',
      scoreExplanation text not null default '',
      status text not null,
      notes text not null default '',
      source text not null,
      rawTags text not null,
      hasVerifiedWebsite integer not null default 0,
      websiteStatus text not null default 'unknown',
      instagramUrl text,
      facebookUrl text,
      dataConfidenceScore integer not null default 0,
      dataConfidenceLabel text not null default 'Baixa',
      validationStatus text not null default 'pending',
      lastCheckedAt text,
      firstContactAt text,
      lastContactAt text,
      nextActionAt text,
      estimatedValue real,
      offerType text,
      contactChannel text,
      contactHistory text not null default '[]',
      websiteAnalysisScore integer,
      websiteAnalysisLabel text,
      websiteAnalysisNotes text not null default '[]',
      websiteAnalyzedAt text,
      createdAt text not null,
      updatedAt text not null
    );

    create table if not exists searches (
      id text primary key,
      location text not null,
      radiusKm real not null,
      categories text not null,
      filters text not null default '{}',
      geo text not null default '{}',
      results text not null default '[]',
      resultCount integer not null,
      createdAt text not null
    );

    create table if not exists campaigns (
      id text primary key,
      name text not null,
      city text not null,
      niche text not null,
      objective text not null,
      primaryOffer text not null,
      leadIds text not null,
      createdAt text not null,
      updatedAt text not null
    );

  `);

  addMissingColumn(database, "leads", "scorePositiveReasons", "text not null default '[]'");
  addMissingColumn(database, "leads", "scoreNegativeReasons", "text not null default '[]'");
  addMissingColumn(database, "leads", "scoreExplanation", "text not null default ''");
  addMissingColumn(database, "leads", "email", "text");
  addMissingColumn(database, "leads", "hasVerifiedWebsite", "integer not null default 0");
  addMissingColumn(database, "leads", "websiteStatus", "text not null default 'unknown'");
  addMissingColumn(database, "leads", "instagramUrl", "text");
  addMissingColumn(database, "leads", "facebookUrl", "text");
  addMissingColumn(database, "leads", "dataConfidenceScore", "integer not null default 0");
  addMissingColumn(database, "leads", "dataConfidenceLabel", "text not null default 'Baixa'");
  addMissingColumn(database, "leads", "validationStatus", "text not null default 'pending'");
  addMissingColumn(database, "leads", "lastCheckedAt", "text");
  addMissingColumn(database, "leads", "firstContactAt", "text");
  addMissingColumn(database, "leads", "lastContactAt", "text");
  addMissingColumn(database, "leads", "nextActionAt", "text");
  addMissingColumn(database, "leads", "estimatedValue", "real");
  addMissingColumn(database, "leads", "offerType", "text");
  addMissingColumn(database, "leads", "contactChannel", "text");
  addMissingColumn(database, "leads", "contactHistory", "text not null default '[]'");
  addMissingColumn(database, "leads", "websiteAnalysisScore", "integer");
  addMissingColumn(database, "leads", "websiteAnalysisLabel", "text");
  addMissingColumn(database, "leads", "websiteAnalysisNotes", "text not null default '[]'");
  addMissingColumn(database, "leads", "websiteAnalyzedAt", "text");
  addMissingColumn(database, "searches", "filters", "text not null default '{}'");
  addMissingColumn(database, "searches", "geo", "text not null default '{}'");
  addMissingColumn(database, "searches", "results", "text not null default '[]'");

  database.exec(`
    create index if not exists leads_score_idx on leads(score desc);
    create index if not exists leads_status_idx on leads(status);
    create index if not exists leads_validation_idx on leads(validationStatus);
    create index if not exists leads_website_status_idx on leads(websiteStatus);
    create index if not exists searches_created_idx on searches(createdAt desc);
    create index if not exists campaigns_created_idx on campaigns(createdAt desc);
  `);
}

export function listLeads(): Lead[] {
  const rows = getDb().prepare("select * from leads order by score desc, updatedAt desc").all();
  return rows.map(rowToLead);
}

export function listLeadsByIds(ids: string[]): Lead[] {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) return [];
  const placeholders = uniqueIds.map(() => "?").join(",");
  const rows = getDb().prepare(`select * from leads where id in (${placeholders})`).all(...uniqueIds);
  return rows.map(rowToLead);
}

export function saveLead(lead: Lead) {
  const now = new Date().toISOString();
  const prepared = leadToDb({ ...withLeadDefaults(lead), createdAt: lead.createdAt || now, updatedAt: now });
  getDb()
    .prepare(
      `insert into leads (
        id, osmId, name, category, phone, website, address, city, lat, lng, score, scoreLabel,
        scoreReasons, scorePositiveReasons, scoreNegativeReasons, scoreExplanation, status, notes, source, rawTags,
        email, hasVerifiedWebsite, websiteStatus, instagramUrl, facebookUrl, dataConfidenceScore, dataConfidenceLabel, validationStatus, lastCheckedAt,
        firstContactAt, lastContactAt, nextActionAt, estimatedValue, offerType, contactChannel, contactHistory,
        websiteAnalysisScore, websiteAnalysisLabel, websiteAnalysisNotes, websiteAnalyzedAt, createdAt, updatedAt
      ) values (
        @id, @osmId, @name, @category, @phone, @website, @address, @city, @lat, @lng, @score, @scoreLabel,
        @scoreReasons, @scorePositiveReasons, @scoreNegativeReasons, @scoreExplanation, @status, @notes, @source, @rawTags,
        @email, @hasVerifiedWebsite, @websiteStatus, @instagramUrl, @facebookUrl, @dataConfidenceScore, @dataConfidenceLabel, @validationStatus, @lastCheckedAt,
        @firstContactAt, @lastContactAt, @nextActionAt, @estimatedValue, @offerType, @contactChannel, @contactHistory,
        @websiteAnalysisScore, @websiteAnalysisLabel, @websiteAnalysisNotes, @websiteAnalyzedAt, @createdAt, @updatedAt
      )
      on conflict(id) do update set
        osmId = excluded.osmId,
        name = excluded.name,
        category = excluded.category,
        phone = coalesce(excluded.phone, leads.phone),
        email = coalesce(excluded.email, leads.email),
        website = coalesce(excluded.website, leads.website),
        address = excluded.address,
        city = excluded.city,
        lat = excluded.lat,
        lng = excluded.lng,
        score = excluded.score,
        scoreLabel = excluded.scoreLabel,
        scoreReasons = excluded.scoreReasons,
        scorePositiveReasons = excluded.scorePositiveReasons,
        scoreNegativeReasons = excluded.scoreNegativeReasons,
        scoreExplanation = excluded.scoreExplanation,
        status = leads.status,
        notes = leads.notes,
        source = excluded.source,
        rawTags = excluded.rawTags,
        instagramUrl = coalesce(excluded.instagramUrl, leads.instagramUrl),
        facebookUrl = coalesce(excluded.facebookUrl, leads.facebookUrl),
        dataConfidenceScore = excluded.dataConfidenceScore,
        dataConfidenceLabel = excluded.dataConfidenceLabel,
        updatedAt = excluded.updatedAt`
    )
    .run(prepared);
  return getLead(lead.id);
}

export function updateLead(id: string, patch: LeadPatch) {
  const current = getLead(id);
  if (!current) return null;

  const next = withLeadDefaults({
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  });

  const score = calculateLeadScore(next);
  next.score = score.score;
  next.scoreLabel = score.scoreLabel;
  next.scoreReasons = score.reasons;
  next.scorePositiveReasons = score.positiveReasons;
  next.scoreNegativeReasons = score.negativeReasons;
  next.scoreExplanation = score.explanation;

  getDb()
    .prepare(
      `update leads set
        status = @status,
        notes = @notes,
        phone = @phone,
        email = @email,
        website = @website,
        score = @score,
        scoreLabel = @scoreLabel,
        scoreReasons = @scoreReasons,
        scorePositiveReasons = @scorePositiveReasons,
        scoreNegativeReasons = @scoreNegativeReasons,
        scoreExplanation = @scoreExplanation,
        hasVerifiedWebsite = @hasVerifiedWebsite,
        websiteStatus = @websiteStatus,
        instagramUrl = @instagramUrl,
        facebookUrl = @facebookUrl,
        dataConfidenceScore = @dataConfidenceScore,
        dataConfidenceLabel = @dataConfidenceLabel,
        validationStatus = @validationStatus,
        lastCheckedAt = @lastCheckedAt,
        firstContactAt = @firstContactAt,
        lastContactAt = @lastContactAt,
        nextActionAt = @nextActionAt,
        estimatedValue = @estimatedValue,
        offerType = @offerType,
        contactChannel = @contactChannel,
        contactHistory = @contactHistory,
        websiteAnalysisScore = @websiteAnalysisScore,
        websiteAnalysisLabel = @websiteAnalysisLabel,
        websiteAnalysisNotes = @websiteAnalysisNotes,
        websiteAnalyzedAt = @websiteAnalyzedAt,
        updatedAt = @updatedAt
      where id = @id`
    )
    .run(leadToDb(next));
  return getLead(id);
}

export function getLead(id: string) {
  const row = getDb().prepare("select * from leads where id = ?").get(id);
  return row ? rowToLead(row) : null;
}

export function recordSearch(search: Omit<SearchRun, "id" | "createdAt"> & { leads: Lead[] }) {
  const run: SearchRun = {
    location: search.location,
    radiusKm: search.radiusKm,
    categories: search.categories,
    filters: search.filters,
    geo: search.geo,
    resultCount: search.resultCount,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  getDb()
    .prepare(
      `insert into searches (id, location, radiusKm, categories, filters, geo, results, resultCount, createdAt)
       values (@id, @location, @radiusKm, @categories, @filters, @geo, @results, @resultCount, @createdAt)`
    )
    .run({
      ...run,
      categories: JSON.stringify(run.categories),
      filters: JSON.stringify(run.filters),
      geo: JSON.stringify(run.geo),
      results: JSON.stringify(search.leads)
    });
  return run;
}

export function listSearches(): SearchRun[] {
  return getDb()
    .prepare("select * from searches order by createdAt desc limit 12")
    .all()
    .map(rowToSearch);
}

export function getSearch(id: string): SearchRunDetail | null {
  const row = getDb().prepare("select * from searches where id = ?").get(id);
  if (!row) return null;

  const search = rowToSearch(row);
  const item = row as Record<string, unknown>;
  const storedLeads = safeJson<Lead[]>(String(item.results ?? "[]"), []);
  const savedLeads = listLeadsByIds(storedLeads.map((lead) => lead.id));
  const savedLeadById = new Map(savedLeads.map((lead) => [lead.id, lead]));
  return {
    ...search,
    leads: storedLeads.map((lead) => savedLeadById.get(lead.id) ?? lead),
    savedLeadIds: savedLeads.map((lead) => lead.id)
  };
}

export function listCampaigns(): Campaign[] {
  return getDb()
    .prepare("select * from campaigns order by createdAt desc")
    .all()
    .map(rowToCampaign);
}

export function getCampaign(id: string) {
  const row = getDb().prepare("select * from campaigns where id = ?").get(id);
  return row ? rowToCampaign(row) : null;
}

export function saveCampaign(input: Omit<Campaign, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Campaign, "id" | "createdAt" | "updatedAt">>) {
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name,
    city: input.city,
    niche: input.niche,
    objective: input.objective,
    primaryOffer: input.primaryOffer,
    leadIds: input.leadIds ?? [],
    createdAt: input.createdAt ?? now,
    updatedAt: now
  };
  getDb()
    .prepare(
      `insert into campaigns (id, name, city, niche, objective, primaryOffer, leadIds, createdAt, updatedAt)
       values (@id, @name, @city, @niche, @objective, @primaryOffer, @leadIds, @createdAt, @updatedAt)
       on conflict(id) do update set
        name = excluded.name,
        city = excluded.city,
        niche = excluded.niche,
        objective = excluded.objective,
        primaryOffer = excluded.primaryOffer,
        leadIds = excluded.leadIds,
        updatedAt = excluded.updatedAt`
    )
    .run({ ...campaign, leadIds: JSON.stringify(campaign.leadIds) });
  return getCampaign(campaign.id);
}

export function updateCampaign(id: string, patch: Partial<Omit<Campaign, "id" | "createdAt" | "updatedAt">>) {
  const current = getCampaign(id);
  if (!current) return null;
  return saveCampaign({ ...current, ...patch, id, createdAt: current.createdAt });
}

export function campaignMetrics(campaign: Campaign, leads = listLeads()): CampaignMetrics {
  const set = new Set(campaign.leadIds);
  const campaignLeads = leads.filter((lead) => set.has(lead.id));
  return {
    total: campaignLeads.length,
    verified: campaignLeads.filter((lead) => lead.validationStatus === "verified" || lead.status === "Verificado").length,
    contacted: campaignLeads.filter((lead) => ["Contato enviado", "Respondeu", "Reunião marcada", "Proposta enviada", "Fechado"].includes(lead.status)).length,
    responses: campaignLeads.filter((lead) => ["Respondeu", "Reunião marcada", "Proposta enviada", "Fechado"].includes(lead.status)).length,
    meetings: campaignLeads.filter((lead) => ["Reunião marcada", "Proposta enviada", "Fechado"].includes(lead.status)).length,
    proposals: campaignLeads.filter((lead) => ["Proposta enviada", "Fechado"].includes(lead.status)).length,
    closed: campaignLeads.filter((lead) => lead.status === "Fechado").length
  };
}

export function dashboardStats() {
  const leads = listLeads();
  const total = leads.length;
  const noSite = leads.filter((lead) => !lead.website || lead.websiteStatus === "no_website").length;
  const withPhone = leads.filter((lead) => Boolean(lead.phone)).length;
  const badSite = leads.filter((lead) => lead.websiteStatus === "bad_website" || lead.websiteAnalysisLabel === "Site ruim").length;
  const great = leads.filter((lead) => lead.score >= 80).length;
  const verified = leads.filter((lead) => lead.validationStatus === "verified" || lead.status === "Verificado").length;
  const contacted = leads.filter((lead) => ["Contato enviado", "Respondeu", "Reunião marcada", "Proposta enviada", "Fechado"].includes(lead.status)).length;
  const responded = leads.filter((lead) => ["Respondeu", "Reunião marcada", "Proposta enviada", "Fechado"].includes(lead.status)).length;
  const proposals = leads.filter((lead) => ["Proposta enviada", "Fechado"].includes(lead.status)).length;
  const closed = leads.filter((lead) => lead.status === "Fechado").length;
  const openEstimatedValue = leads
    .filter((lead) => !["Fechado", "Perdido", "Descartado"].includes(lead.status))
    .reduce((totalValue, lead) => totalValue + (lead.estimatedValue ?? 0), 0);
  const responseRate = contacted ? Math.round((responded / contacted) * 100) : 0;
  return { total, noSite, withPhone, badSite, great, verified, contacted, responded, proposals, closed, openEstimatedValue, responseRate };
}

function addMissingColumn(database: Database.Database, table: string, column: string, definition: string) {
  const columns = new Set(
    (database.prepare(`pragma table_info(${table})`).all() as Array<{ name: string }>).map((item) => item.name)
  );
  if (!columns.has(column)) database.exec(`alter table ${table} add column ${column} ${definition}`);
}

function rowToLead(row: unknown): Lead {
  const item = row as Record<string, unknown>;
  const rawTags = safeJson(String(item.rawTags ?? "{}"), {});
  const base = withLeadDefaults({
    ...(item as Partial<Lead>),
    source: "openstreetmap",
    status: normalizeLeadStatus(String(item.status ?? "Novo")),
    scoreReasons: safeJson(String(item.scoreReasons ?? "[]"), []),
    scorePositiveReasons: safeJson(String(item.scorePositiveReasons ?? "[]"), []),
    scoreNegativeReasons: safeJson(String(item.scoreNegativeReasons ?? "[]"), []),
    hasVerifiedWebsite: Boolean(item.hasVerifiedWebsite),
    rawTags,
    contactHistory: safeJson(String(item.contactHistory ?? "[]"), []),
    websiteAnalysisNotes: safeJson(String(item.websiteAnalysisNotes ?? "[]"), [])
  });

  if (base.scorePositiveReasons.length === 0 && base.scoreNegativeReasons.length === 0) {
    const score = calculateLeadScore(base);
    base.score = score.score;
    base.scoreLabel = score.scoreLabel;
    base.scoreReasons = score.reasons;
    base.scorePositiveReasons = score.positiveReasons;
    base.scoreNegativeReasons = score.negativeReasons;
    base.scoreExplanation = score.explanation;
  }

  return base;
}

function rowToCampaign(row: unknown): Campaign {
  const item = row as Record<string, unknown>;
  return {
    id: String(item.id),
    name: String(item.name),
    city: String(item.city),
    niche: String(item.niche),
    objective: String(item.objective),
    primaryOffer: String(item.primaryOffer),
    leadIds: safeJson(String(item.leadIds ?? "[]"), []),
    createdAt: String(item.createdAt),
    updatedAt: String(item.updatedAt)
  };
}

function rowToSearch(row: unknown): SearchRun {
  const item = row as Record<string, unknown>;
  const location = String(item.location ?? "");
  const defaultGeo = { label: location, lat: 0, lng: 0, city: null };
  return {
    id: String(item.id),
    location,
    radiusKm: Number(item.radiusKm ?? 0),
    categories: safeJson(String(item.categories ?? "[]"), []),
    filters: { ...defaultSearchFilters(), ...safeJson<Partial<LeadSearchFilters>>(String(item.filters ?? "{}"), {}) },
    geo: { ...defaultGeo, ...safeJson<Partial<SearchGeo>>(String(item.geo ?? "{}"), {}) },
    resultCount: Number(item.resultCount ?? 0),
    createdAt: String(item.createdAt)
  };
}

function defaultSearchFilters(): LeadSearchFilters {
  return {
    noWebsiteOnly: false,
    withPhoneOnly: false,
    ignoreFranchises: false,
    prioritizeHighTicket: false
  };
}

function leadToDb(lead: Lead) {
  return {
    ...lead,
    osmId: lead.osmId ?? null,
    hasVerifiedWebsite: lead.hasVerifiedWebsite ? 1 : 0,
    scoreReasons: JSON.stringify(lead.scoreReasons),
    scorePositiveReasons: JSON.stringify(lead.scorePositiveReasons),
    scoreNegativeReasons: JSON.stringify(lead.scoreNegativeReasons),
    rawTags: JSON.stringify(lead.rawTags),
    contactHistory: JSON.stringify(lead.contactHistory),
    websiteAnalysisNotes: JSON.stringify(lead.websiteAnalysisNotes)
  };
}

function withLeadDefaults(input: Partial<Lead>): Lead {
  const now = new Date().toISOString();
  const rawTags = input.rawTags ?? {};
  const phone = normalizePhone(input.phone ?? null);
  const email = normalizeEmail(input.email ?? null);
  const website = normalizeWebsite(input.website ?? null);
  const instagramUrl = normalizeSocialUrl(input.instagramUrl ?? null, "https://www.instagram.com/");
  const facebookUrl = normalizeSocialUrl(input.facebookUrl ?? null, "https://www.facebook.com/");
  const draft: Lead = {
    id: input.id ?? crypto.randomUUID(),
    osmId: input.osmId,
    name: input.name ?? "Lead sem nome",
    category: input.category ?? "Empresa local",
    phone,
    email,
    website,
    address: input.address ?? null,
    city: input.city ?? null,
    lat: input.lat ?? 0,
    lng: input.lng ?? 0,
    score: input.score ?? 0,
    scoreLabel: input.scoreLabel ?? "Baixo potencial",
    scoreReasons: input.scoreReasons ?? [],
    scorePositiveReasons: input.scorePositiveReasons ?? [],
    scoreNegativeReasons: input.scoreNegativeReasons ?? [],
    scoreExplanation: input.scoreExplanation ?? "",
    status: normalizeLeadStatus(input.status ?? "Novo"),
    notes: input.notes ?? "",
    source: "openstreetmap",
    rawTags,
    hasVerifiedWebsite: input.hasVerifiedWebsite ?? false,
    websiteStatus: input.websiteStatus ?? (website ? "has_website" : "unknown"),
    instagramUrl,
    facebookUrl,
    dataConfidenceScore: 0,
    dataConfidenceLabel: "Baixa",
    validationStatus: input.validationStatus ?? "pending",
    lastCheckedAt: input.lastCheckedAt ?? null,
    firstContactAt: input.firstContactAt ?? null,
    lastContactAt: input.lastContactAt ?? null,
    nextActionAt: input.nextActionAt ?? null,
    estimatedValue: input.estimatedValue ?? null,
    offerType: input.offerType ?? null,
    contactChannel: input.contactChannel ?? null,
    contactHistory: input.contactHistory ?? [],
    websiteAnalysisScore: input.websiteAnalysisScore ?? null,
    websiteAnalysisLabel: input.websiteAnalysisLabel ?? null,
    websiteAnalysisNotes: input.websiteAnalysisNotes ?? [],
    websiteAnalyzedAt: input.websiteAnalyzedAt ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  };
  const confidence = calculateDataConfidence(draft);
  return {
    ...draft,
    dataConfidenceScore: confidence.score,
    dataConfidenceLabel: confidence.label
  };
}

function normalizeLeadStatus(value: string): LeadStatus {
  const aliases: Record<string, LeadStatus> = {
    Contatado: "Contato enviado",
    Reuniao: "Reunião marcada",
    "Reunião": "Reunião marcada"
  };
  const normalized = aliases[value] ?? value;
  const valid: LeadStatus[] = ["Novo", "Verificar", "Verificado", "Contato enviado", "Respondeu", "Reunião marcada", "Proposta enviada", "Fechado", "Perdido", "Descartado"];
  return valid.includes(normalized as LeadStatus) ? (normalized as LeadStatus) : "Novo";
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
