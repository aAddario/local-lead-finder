"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock3, MessageCircle, PhoneCall, RotateCcw } from "lucide-react";
import { ActionFeedback } from "@/components/action-feedback";
import { EmptyState } from "@/components/empty-state";
import { SkeletonRows } from "@/components/skeleton";
import { ScoreBadge } from "@/components/score-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchJson } from "@/lib/api";
import { daysFromNow, formatActionDate, getFollowupQueue, isDueToday, isOverdue } from "@/lib/followups";
import type { ContactChannel, Lead } from "@/types/lead";

type Feedback = { message: string; tone: "success" | "error" } | null;

export default function FollowupsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    fetchJson<{ leads: Lead[] }>("/api/leads")
      .then((data) => setLeads(data.leads))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const queue = useMemo(() => getFollowupQueue(leads), [leads]);
  const primaryQueue = [...queue.overdue, ...queue.dueToday];

  async function patchLead(lead: Lead, patch: Partial<Lead>, message: string) {
    setBusyId(lead.id);
    setFeedback(null);
    try {
      const data = await fetchJson<{ lead: Lead }>(`/api/leads/${lead.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });
      setLeads((current) => current.map((item) => (item.id === data.lead.id ? data.lead : item)));
      setFeedback({ tone: "success", message });
    } catch (err) {
      setFeedback({ tone: "error", message: err instanceof Error ? err.message : "Ação falhou." });
    } finally {
      setBusyId("");
    }
  }

  function markContacted(lead: Lead, channel: ContactChannel = "WhatsApp") {
    const now = new Date().toISOString();
    patchLead(
      lead,
      {
        status: "Contato enviado",
        firstContactAt: lead.firstContactAt ?? now,
        lastContactAt: now,
        contactChannel: channel,
        contactHistory: [...lead.contactHistory, historyEntry(channel, "Contato marcado manualmente")]
      },
      "Contato registrado."
    );
  }

  function markResponse(lead: Lead) {
    const now = new Date().toISOString();
    patchLead(
      lead,
      {
        status: "Respondeu",
        lastContactAt: now,
        contactHistory: [...lead.contactHistory, historyEntry(lead.contactChannel ?? "WhatsApp", "Resposta registrada")]
      },
      "Resposta registrada."
    );
  }

  function schedule(lead: Lead, days: number) {
    const nextActionAt = daysFromNow(days);
    patchLead(
      lead,
      {
        nextActionAt,
        contactHistory: [...lead.contactHistory, historyEntry(lead.contactChannel ?? "WhatsApp", `Próxima ação: ${formatActionDate(nextActionAt)}`)]
      },
      "Próxima ação agendada."
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <CalendarClock className="h-4 w-4" />
            Follow-ups
          </p>
          <h1 className="mt-2 text-2xl font-medium tracking-tight text-charcoal dark:text-white md:text-3xl">
            Priorize ações vencidas, respostas e próximos contatos.
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Vencidos" value={queue.overdue.length} tone="red" />
          <Metric label="Hoje" value={queue.dueToday.length} tone="amber" />
          <Metric label="Próximos" value={queue.upcoming.length} tone="green" />
        </div>
      </section>

      <ActionFeedback message={feedback?.message ?? null} tone={feedback?.tone ?? "success"} />

      {loading && <Card className="p-6"><SkeletonRows /></Card>}
      {error && <EmptyState title="Não foi possível carregar follow-ups" text={error} />}
      {!loading && !error && leads.length === 0 && <EmptyState title="Nenhum lead salvo" text="Salve leads e agende a próxima ação." />}

      {!loading && !error && (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <section className="space-y-4">
            <QueueSection title="Vencidos / hoje" leads={primaryQueue}>
              {(lead) => <FollowupCard lead={lead} busy={busyId === lead.id} onContact={markContacted} onResponse={markResponse} onSchedule={schedule} />}
            </QueueSection>
            <QueueSection title="Próximos" leads={queue.upcoming.slice(0, 12)}>
              {(lead) => <FollowupCard lead={lead} busy={busyId === lead.id} onContact={markContacted} onResponse={markResponse} onSchedule={schedule} />}
            </QueueSection>
          </section>

          <section className="space-y-4">
            <Card className="p-5">
              <h2 className="text-lg font-bold tracking-tight text-charcoal dark:text-white">Sem data</h2>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Leads ativos sem próxima ação.</p>
              <div className="mt-4 space-y-3">
                {queue.unscheduled.slice(0, 8).map((lead) => (
                  <CompactLead key={lead.id} lead={lead} busy={busyId === lead.id} onSchedule={schedule} />
                ))}
                {queue.unscheduled.length === 0 && <p className="text-sm text-stone-500 dark:text-stone-400">Nada pendente sem data.</p>}
              </div>
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}

function QueueSection({ title, leads, children }: { title: string; leads: Lead[]; children: (lead: Lead) => React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold tracking-tight text-charcoal dark:text-white">{title}</h2>
      {leads.length === 0 ? (
        <Card className="p-6 text-sm text-stone-500 dark:text-stone-400">Fila vazia.</Card>
      ) : (
        <div className="space-y-4">{leads.map((lead) => children(lead))}</div>
      )}
    </section>
  );
}

function FollowupCard({ lead, busy, onContact, onResponse, onSchedule }: { lead: Lead; busy: boolean; onContact: (lead: Lead) => void; onResponse: (lead: Lead) => void; onSchedule: (lead: Lead, days: number) => void }) {
  const urgent = isOverdue(lead.nextActionAt);
  const today = isDueToday(lead.nextActionAt);
  return (
    <Card className="p-5 shadow-tight">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={urgent ? "rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-200" : today ? "rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200" : "rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"}>
              {urgent ? "Vencido" : today ? "Hoje" : formatActionDate(lead.nextActionAt)}
            </span>
            <ScoreBadge score={lead.score} label={lead.scoreLabel} />
          </div>
          <h3 className="mt-2 truncate text-lg font-bold text-charcoal dark:text-white">{lead.name}</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{lead.category} · {lead.city ?? "sem cidade"} · {lead.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="cream" onClick={() => onContact(lead)} disabled={busy}><PhoneCall className="h-4 w-4" />Contato</Button>
          <Button size="sm" variant="cream" onClick={() => onResponse(lead)} disabled={busy}><MessageCircle className="h-4 w-4" />Resposta</Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => onSchedule(lead, 1)} disabled={busy}><Clock3 className="h-4 w-4" />Amanhã</Button>
        <Button size="sm" variant="ghost" onClick={() => onSchedule(lead, 3)} disabled={busy}><RotateCcw className="h-4 w-4" />3 dias</Button>
        <Button size="sm" variant="ghost" onClick={() => onSchedule(lead, 7)} disabled={busy}><CalendarClock className="h-4 w-4" />7 dias</Button>
      </div>
      <Timeline lead={lead} />
    </Card>
  );
}

function Timeline({ lead }: { lead: Lead }) {
  const entries = [...lead.contactHistory].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  return (
    <div className="mt-4 border-t border-parchment pt-4 dark:border-white/10">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Histórico</p>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">Sem histórico ainda.</p>
      ) : (
        <div className="mt-2 space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="flex gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-stone-600 dark:text-stone-300">
                <span className="font-bold text-charcoal dark:text-white">{formatActionDate(entry.at)}</span> · {entry.channel} · {entry.note}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompactLead({ lead, busy, onSchedule }: { lead: Lead; busy: boolean; onSchedule: (lead: Lead, days: number) => void }) {
  return (
    <div className="rounded-xl border border-parchment bg-stone-50/70 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="truncate font-bold text-charcoal dark:text-white">{lead.name}</p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{lead.category} · {lead.score}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="cream" onClick={() => onSchedule(lead, 1)} disabled={busy}>Amanhã</Button>
        <Button size="sm" variant="ghost" onClick={() => onSchedule(lead, 3)} disabled={busy}>3 dias</Button>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "green" }) {
  const color = tone === "red" ? "text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-200" : tone === "amber" ? "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-200" : "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-200";
  return (
    <div className={`rounded-xl px-4 py-3 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}

function historyEntry(channel: ContactChannel, note: string) {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    channel,
    note
  };
}
