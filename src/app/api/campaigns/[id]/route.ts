import { NextResponse } from "next/server";
import { z } from "zod";
import { campaignMetrics, getCampaign, listLeads, updateCampaign } from "@/lib/db";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  city: z.string().min(2).max(120).optional(),
  niche: z.string().min(2).max(120).optional(),
  objective: z.string().min(2).max(240).optional(),
  primaryOffer: z.string().min(2).max(240).optional(),
  leadIds: z.array(z.string()).optional()
});

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const campaign = getCampaign(id);
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
  const leads = listLeads();
  return NextResponse.json({
    campaign,
    leads: leads.filter((lead) => campaign.leadIds.includes(lead.id)),
    availableLeads: leads,
    metrics: campaignMetrics(campaign, leads)
  });
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const campaign = updateCampaign(id, patchSchema.parse(await req.json()));
    if (!campaign) return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    return NextResponse.json({ campaign, metrics: campaignMetrics(campaign) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar campanha";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
