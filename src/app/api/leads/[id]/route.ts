import { NextResponse } from "next/server";
import { z } from "zod";
import { getLead, updateLead } from "@/lib/db";
import { contactChannels, leadStatuses, validationStatuses, websiteStatuses } from "@/types/lead";

const contactHistorySchema = z.object({
  id: z.string(),
  at: z.string(),
  channel: z.enum(contactChannels),
  note: z.string()
});

const patchSchema = z
  .object({
    status: z.enum(leadStatuses).optional(),
    notes: z.string().max(5000).optional(),
    phone: z.string().max(120).nullable().optional(),
    email: z.string().max(240).nullable().optional(),
    website: z.string().max(500).nullable().optional(),
    hasVerifiedWebsite: z.boolean().optional(),
    websiteStatus: z.enum(websiteStatuses).optional(),
    instagramUrl: z.string().max(500).nullable().optional(),
    facebookUrl: z.string().max(500).nullable().optional(),
    validationStatus: z.enum(validationStatuses).optional(),
    lastCheckedAt: z.string().nullable().optional(),
    firstContactAt: z.string().nullable().optional(),
    lastContactAt: z.string().nullable().optional(),
    nextActionAt: z.string().nullable().optional(),
    estimatedValue: z.number().nullable().optional(),
    offerType: z.string().max(200).nullable().optional(),
    contactChannel: z.enum(contactChannels).nullable().optional(),
    contactHistory: z.array(contactHistorySchema).optional(),
    websiteAnalysisScore: z.number().min(0).max(100).nullable().optional(),
    websiteAnalysisLabel: z.enum(["Site ruim", "Site mediano", "Site bom"]).nullable().optional(),
    websiteAnalysisNotes: z.array(z.string()).optional(),
    websiteAnalyzedAt: z.string().nullable().optional()
  })
  .refine((patch) => Object.keys(patch).length > 0, "Nenhum campo de atualização fornecido");

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const lead = getLead(id);
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const lead = updateLead(id, patchSchema.parse(await req.json()));
    if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
