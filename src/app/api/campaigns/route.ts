import { NextResponse } from "next/server";
import { z } from "zod";
import { campaignMetrics, listCampaigns, listLeads, saveCampaign } from "@/lib/db";

const campaignSchema = z.object({
  name: z.string().min(2).max(120),
  city: z.string().min(2).max(120),
  niche: z.string().min(2).max(120),
  objective: z.string().min(2).max(240),
  primaryOffer: z.string().min(2).max(240),
  leadIds: z.array(z.string()).default([])
});

export async function GET() {
  const leads = listLeads();
  const campaigns = listCampaigns().map((campaign) => ({
    ...campaign,
    metrics: campaignMetrics(campaign, leads)
  }));
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  try {
    const campaign = saveCampaign(campaignSchema.parse(await req.json()));
    if (!campaign) return NextResponse.json({ error: "Campanha não criada" }, { status: 400 });
    return NextResponse.json({ campaign, metrics: campaignMetrics(campaign) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao criar campanha";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
