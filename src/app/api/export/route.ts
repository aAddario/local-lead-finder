import { NextResponse } from "next/server";
import { leadsToCsv } from "@/lib/csv";
import { getCampaign, listLeads } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "all";
  const campaignId = url.searchParams.get("campaignId");
  const leads = filterLeads(listLeads(), scope, campaignId);

  return new NextResponse(leadsToCsv(leads), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=leads-locais.csv"
    }
  });
}

function filterLeads(leads: ReturnType<typeof listLeads>, scope: string, campaignId: string | null) {
  if (scope === "great") return leads.filter((lead) => lead.score >= 80);
  if (scope === "no_site") return leads.filter((lead) => !lead.website || lead.websiteStatus === "no_website");
  if (scope === "verified") return leads.filter((lead) => lead.validationStatus === "verified" || lead.status === "Verificado");
  if (scope === "campaign" && campaignId) {
    const campaign = getCampaign(campaignId);
    if (!campaign) return [];
    const ids = new Set(campaign.leadIds);
    return leads.filter((lead) => ids.has(lead.id));
  }
  return leads;
}
