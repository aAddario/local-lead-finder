import type { Lead } from "@/types/lead";

export function getFollowupQueue(leads: Lead[], now = new Date()) {
  const active = leads.filter((lead) => !["Fechado", "Perdido", "Descartado"].includes(lead.status));
  const withDate = active.filter((lead) => Boolean(lead.nextActionAt));
  return {
    overdue: withDate.filter((lead) => isOverdue(lead.nextActionAt, now)).sort(sortByNextAction),
    dueToday: withDate.filter((lead) => isDueToday(lead.nextActionAt, now)).sort(sortByNextAction),
    upcoming: withDate.filter((lead) => isUpcoming(lead.nextActionAt, now)).sort(sortByNextAction),
    unscheduled: active.filter((lead) => !lead.nextActionAt).sort((a, b) => b.score - a.score)
  };
}

export function isOverdue(value: string | null, now = new Date()) {
  if (!value) return false;
  return startOfDay(new Date(value)).getTime() < startOfDay(now).getTime();
}

export function isDueToday(value: string | null, now = new Date()) {
  if (!value) return false;
  return startOfDay(new Date(value)).getTime() === startOfDay(now).getTime();
}

export function isUpcoming(value: string | null, now = new Date()) {
  if (!value) return false;
  const day = startOfDay(new Date(value)).getTime();
  const today = startOfDay(now).getTime();
  return day > today;
}

export function daysFromNow(days: number) {
  const next = startOfDay(new Date());
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function formatActionDate(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function sortByNextAction(a: Lead, b: Lead) {
  return String(a.nextActionAt ?? "").localeCompare(String(b.nextActionAt ?? "")) || b.score - a.score;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
