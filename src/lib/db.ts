import Database from "better-sqlite3";
import path from "node:path";
import type { Lead, LeadStatus, SearchRun } from "@/types/lead";

const dbPath = path.join(process.cwd(), "local-lead-finder.sqlite");
let db: Database.Database | null = null;

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
      website text,
      address text,
      city text,
      lat real not null,
      lng real not null,
      score integer not null,
      scoreLabel text not null,
      scoreReasons text not null,
      status text not null,
      notes text not null default '',
      source text not null,
      rawTags text not null,
      createdAt text not null,
      updatedAt text not null
    );

    create table if not exists searches (
      id text primary key,
      location text not null,
      radiusKm real not null,
      categories text not null,
      resultCount integer not null,
      createdAt text not null
    );

    create index if not exists leads_score_idx on leads(score desc);
    create index if not exists leads_status_idx on leads(status);
    create index if not exists searches_created_idx on searches(createdAt desc);
  `);
}

type LeadRow = Omit<Lead, "scoreReasons" | "rawTags"> & {
  scoreReasons: string;
  rawTags: string;
};

export function listLeads(): Lead[] {
  const rows = getDb()
    .prepare("select * from leads order by score desc, updatedAt desc")
    .all() as LeadRow[];
  return rows.map(rowToLead);
}

export function saveLead(lead: Lead) {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `insert into leads (
        id, osmId, name, category, phone, website, address, city, lat, lng, score, scoreLabel,
        scoreReasons, status, notes, source, rawTags, createdAt, updatedAt
      ) values (
        @id, @osmId, @name, @category, @phone, @website, @address, @city, @lat, @lng, @score, @scoreLabel,
        @scoreReasons, @status, @notes, @source, @rawTags, @createdAt, @updatedAt
      )
      on conflict(id) do update set
        osmId = excluded.osmId,
        name = excluded.name,
        category = excluded.category,
        phone = excluded.phone,
        website = excluded.website,
        address = excluded.address,
        city = excluded.city,
        lat = excluded.lat,
        lng = excluded.lng,
        score = excluded.score,
        scoreLabel = excluded.scoreLabel,
        scoreReasons = excluded.scoreReasons,
        status = leads.status,
        notes = leads.notes,
        source = excluded.source,
        rawTags = excluded.rawTags,
        updatedAt = excluded.updatedAt`
    )
    .run({
      ...lead,
      scoreReasons: JSON.stringify(lead.scoreReasons),
      rawTags: JSON.stringify(lead.rawTags),
      createdAt: lead.createdAt || now,
      updatedAt: now
    });
  return getLead(lead.id);
}

export function updateLead(id: string, patch: Partial<Pick<Lead, "status" | "notes" | "phone" | "website">>) {
  const current = getLead(id);
  if (!current) return null;
  const next = {
    status: patch.status ?? current.status,
    notes: patch.notes ?? current.notes,
    phone: patch.phone ?? current.phone,
    website: patch.website ?? current.website,
    updatedAt: new Date().toISOString(),
    id
  };
  getDb()
    .prepare("update leads set status = @status, notes = @notes, phone = @phone, website = @website, updatedAt = @updatedAt where id = @id")
    .run(next);
  return getLead(id);
}

export function getLead(id: string) {
  const row = getDb().prepare("select * from leads where id = ?").get(id);
  return row ? rowToLead(row as LeadRow) : null;
}

export function recordSearch(search: Omit<SearchRun, "id" | "createdAt">) {
  const run: SearchRun = {
    ...search,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  getDb()
    .prepare("insert into searches (id, location, radiusKm, categories, resultCount, createdAt) values (@id, @location, @radiusKm, @categories, @resultCount, @createdAt)")
    .run({ ...run, categories: JSON.stringify(run.categories) });
}

export function listSearches(): SearchRun[] {
  return getDb()
    .prepare("select * from searches order by createdAt desc limit 12")
    .all()
    .map((row) => {
      const item = row as Omit<SearchRun, "categories"> & { categories: string };
      return { ...item, categories: JSON.parse(item.categories) as string[] };
    });
}

export function dashboardStats() {
  const leads = listLeads();
  const total = leads.length;
  const noSite = leads.filter((lead) => !lead.website).length;
  const withPhone = leads.filter((lead) => Boolean(lead.phone)).length;
  const great = leads.filter((lead) => lead.score >= 80).length;
  const contacted = leads.filter((lead) => ["Contatado", "Respondeu", "Reuniao", "Proposta enviada", "Fechado"].includes(lead.status)).length;
  const closed = leads.filter((lead) => lead.status === "Fechado").length;
  const responseRate = contacted ? Math.round((leads.filter((lead) => ["Respondeu", "Reuniao", "Proposta enviada", "Fechado"].includes(lead.status)).length / contacted) * 100) : 0;
  return { total, noSite, withPhone, great, contacted, closed, responseRate };
}

function rowToLead(row: LeadRow): Lead {
  return {
    ...row,
    status: row.status as LeadStatus,
    source: "openstreetmap",
    scoreReasons: safeJson(row.scoreReasons, []),
    rawTags: safeJson(row.rawTags, {})
  };
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
